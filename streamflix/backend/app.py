import os
import re
import requests
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId
import jwt
import bcrypt

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-this')
TMDB_API_KEY = os.getenv('TMDB_API_KEY')
TMDB_BASE_URL = 'https://api.themoviedb.org/3'
TMDB_IMG_URL = 'https://image.tmdb.org/t/p/w500'
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@streamflix.com')

client = MongoClient(os.getenv('MONGO_URI'))
db = client.streamflix

try:
    client.admin.command('ping')
    print("MongoDB connected successfully!")
    print(f"TMDB API Key: {'SET -> ' + TMDB_API_KEY[:4] + '...' if TMDB_API_KEY else 'NOT SET - THIS IS THE PROBLEM'}")
    print(f"Admin email: {ADMIN_EMAIL}")
except Exception as e:
    print(f"MongoDB connection failed: {e}")


# ============================================
# HELPERS
# ============================================
def serialize_movie(movie):
    movie['_id'] = str(movie['_id'])
    if isinstance(movie.get('cast'), list):
        movie['cast'] = movie['cast']
    if isinstance(movie.get('writers'), list):
        movie['writers'] = movie['writers']
    if isinstance(movie.get('seasons'), list):
        movie['seasons'] = movie['seasons']
    return movie


def serialize_user(user):
    return {
        '_id': str(user['_id']),
        'username': user['username'],
        'email': user['email'],
        'role': user.get('role', 'user'),
        'created_at': user.get('created_at', '')
    }


def validate_movie(data):
    errors = []
    if not data:
        return ['Request body is empty']
    if not data.get('title'):
        errors.append('Title is required')
    if data.get('type') not in ('movie', 'show', 'series'):
        data['type'] = 'movie'
    return errors


def safe_year(date_str):
    """Safely extract year from date string like '2023-01-15'"""
    if not date_str:
        return None
    date_str = str(date_str).strip()
    if len(date_str) >= 4:
        return date_str[:4]
    return None


# ============================================
# AUTH MIDDLEWARE
# ============================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = db.users.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401

        return f(current_user, *args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = db.users.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401

        if current_user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403

        return f(current_user, *args, **kwargs)
    return decorated


# ============================================
# AUTH ROUTES
# ============================================
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    if not data:
        return jsonify({'error': 'Request body is empty'}), 400

    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    errors = []
    if not username or len(username) < 3:
        errors.append('Username must be at least 3 characters')
    if not email or '@' not in email:
        errors.append('Valid email is required')
    if not password or len(password) < 6:
        errors.append('Password must be at least 6 characters')
    if errors:
        return jsonify({'errors': errors}), 400

    if db.users.find_one({'email': email}):
        return jsonify({'error': 'Email already registered'}), 409
    if db.users.find_one({'username': username}):
        return jsonify({'error': 'Username already taken'}), 409

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    role = 'admin' if email == ADMIN_EMAIL else 'user'

    user = {
        'username': username,
        'email': email,
        'password': hashed_password,
        'role': role,
        'created_at': datetime.utcnow().isoformat()
    }

    result = db.users.insert_one(user)

    token = jwt.encode(
        {'user_id': str(result.inserted_id), 'exp': datetime.utcnow() + timedelta(days=7)},
        app.config['SECRET_KEY'], algorithm='HS256'
    )

    return jsonify({
        'message': 'User created successfully',
        'token': token,
        'user': {'_id': str(result.inserted_id), 'username': username, 'email': email, 'role': role}
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    if not data:
        return jsonify({'error': 'Request body is empty'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = db.users.find_one({'email': email})
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = jwt.encode(
        {'user_id': str(user['_id']), 'exp': datetime.utcnow() + timedelta(days=7)},
        app.config['SECRET_KEY'], algorithm='HS256'
    )

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': serialize_user(user)
    }), 200


@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({'user': serialize_user(current_user)}), 200


# ============================================
# DEBUG ROUTE (remove in production)
# ============================================
@app.route('/api/debug', methods=['GET'])
def debug():
    return jsonify({
        'tmdb_key_set': bool(TMDB_API_KEY),
        'tmdb_key_preview': (TMDB_API_KEY[:4] + '...') if TMDB_API_KEY else None,
        'mongo_ok': True,
        'admin_email': ADMIN_EMAIL
    }), 200


# ============================================
# TMDB ROUTES
# ============================================
@app.route('/api/tmdb/trending', methods=['GET'])
@token_required
def tmdb_trending(current_user):
    if not TMDB_API_KEY:
        print("ERROR: TMDB_API_KEY is not set in .env file!")
        return jsonify({'error': 'TMDB API key not configured. Add TMDB_API_KEY to your .env file'}), 500

    try:
        print(f"Fetching trending movies from TMDB...")
        res = requests.get(
            f'{TMDB_BASE_URL}/trending/movie/week',
            params={'api_key': TMDB_API_KEY, 'language': 'en-US'},
            timeout=10
        )

        print(f"TMDB trending status code: {res.status_code}")

        if res.status_code == 401:
            return jsonify({'error': 'Invalid TMDB API key. Check your .env file'}), 500
        if res.status_code != 200:
            return jsonify({'error': f'TMDB returned status {res.status_code}'}), 500

        data = res.json()
        raw_results = data.get('results', [])
        print(f"TMDB returned {len(raw_results)} trending movies")

        movies = []
        for m in raw_results:
            release_date = m.get('release_date') or m.get('first_air_date') or ''
            movies.append({
                'tmdb_id': m['id'],
                'title': m.get('title') or m.get('name') or 'Unknown',
                'year': safe_year(release_date),
                'rating': round(m.get('vote_average') or 0, 1),
                'poster': f"{TMDB_IMG_URL}{m['poster_path']}" if m.get('poster_path') else None,
                'description': m.get('overview') or '',
                'type': 'tv' if m.get('media_type') == 'tv' else 'movie'
            })

        print(f"Returning {len(movies)} trending movies to frontend")
        return jsonify(movies), 200

    except requests.exceptions.Timeout:
        print("TMDB request timed out")
        return jsonify({'error': 'TMDB request timed out'}), 500
    except requests.exceptions.ConnectionError:
        print("Cannot connect to TMDB")
        return jsonify({'error': 'Cannot connect to TMDB'}), 500
    except Exception as e:
        import traceback
        print(f"Trending error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/tmdb/search', methods=['GET'])
@token_required
def tmdb_search(current_user):
    query = request.args.get('query', '').strip()
    if not query:
        return jsonify({'error': 'Query required'}), 400
    if not TMDB_API_KEY:
        print("ERROR: TMDB_API_KEY is not set in .env file!")
        return jsonify({'error': 'TMDB API key not configured. Add TMDB_API_KEY to your .env file'}), 500

    try:
        print(f"Searching TMDB for: '{query}'")
        res = requests.get(
            f'{TMDB_BASE_URL}/search/movie',
            params={'api_key': TMDB_API_KEY, 'query': query, 'language': 'en-US'},
            timeout=10
        )

        print(f"TMDB search status code: {res.status_code}")

        if res.status_code == 401:
            return jsonify({'error': 'Invalid TMDB API key. Check your .env file'}), 500
        if res.status_code != 200:
            return jsonify({'error': f'TMDB returned status {res.status_code}'}), 500

        data = res.json()
        raw_results = data.get('results', [])
        print(f"TMDB returned {len(raw_results)} search results")

        movies = []
        for m in raw_results:
            release_date = m.get('release_date') or ''
            movies.append({
                'tmdb_id': m['id'],
                'title': m.get('title') or m.get('name') or 'Unknown',
                'year': safe_year(release_date),
                'rating': round(m.get('vote_average') or 0, 1),
                'poster': f"{TMDB_IMG_URL}{m['poster_path']}" if m.get('poster_path') else None,
                'description': m.get('overview') or '',
                'type': 'movie'
            })

        print(f"Returning {len(movies)} search results to frontend")
        return jsonify(movies), 200

    except requests.exceptions.Timeout:
        return jsonify({'error': 'TMDB request timed out'}), 500
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Cannot connect to TMDB'}), 500
    except Exception as e:
        import traceback
        print(f"Search error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/tmdb/movie/<int:tmdb_id>', methods=['GET'])
@token_required
def tmdb_movie_detail(current_user, tmdb_id):
    if not TMDB_API_KEY:
        return jsonify({'error': 'TMDB API key not configured'}), 500

    try:
        res = requests.get(
            f'{TMDB_BASE_URL}/movie/{tmdb_id}',
            params={'api_key': TMDB_API_KEY, 'language': 'en-US', 'append_to_response': 'videos,credits'},
            timeout=10
        )
        m = res.json()

        genres = [g['name'] for g in m.get('genres', [])]

        trailer = ''
        for video in m.get('videos', {}).get('results', []):
            if video.get('type') == 'Trailer' and video.get('site') == 'YouTube':
                trailer = f"https://www.youtube.com/watch?v={video['key']}"
                break

        cast = []
        for person in m.get('credits', {}).get('cast', [])[:10]:
            cast.append({
                'name': person.get('name', ''),
                'character': person.get('character', ''),
                'profile': f"{TMDB_IMG_URL}{person['profile_path']}" if person.get('profile_path') else ''
            })

        director = ''
        for person in m.get('credits', {}).get('crew', []):
            if person.get('job') == 'Director':
                director = person.get('name', '')
                break

        return jsonify({
            'tmdb_id': m['id'],
            'title': m.get('title', ''),
            'type': 'movie',
            'year': safe_year(m.get('release_date', '')),
            'rating': round(m.get('vote_average', 0), 1),
            'poster': f"{TMDB_IMG_URL}{m['poster_path']}" if m.get('poster_path') else '',
            'backdrop': f"https://image.tmdb.org/t/p/original{m['backdrop_path']}" if m.get('backdrop_path') else '',
            'description': m.get('overview', ''),
            'genre': ', '.join(genres),
            'genres': genres,
            'runtime': m.get('runtime', 0),
            'release_date': m.get('release_date', ''),
            'trailer': trailer,
            'cast': cast,
            'director': director,
            'popularity': m.get('popularity', 0),
            'vote_count': m.get('vote_count', 0)
        }), 200

    except Exception as e:
        return jsonify({'error': f'TMDB request failed: {str(e)}'}), 500


@app.route('/api/tmdb/import/<int:tmdb_id>', methods=['POST'])
@admin_required
def import_tmdb_movie(current_user, tmdb_id):
    # Check if already imported
    existing = db.movies.find_one({'tmdb_id': tmdb_id})
    if existing:
        return jsonify({'message': 'Movie already imported', 'movie': serialize_movie(existing)}), 200

    if not TMDB_API_KEY:
        return jsonify({'error': 'TMDB API key not configured'}), 500

    try:
        res = requests.get(
            f'{TMDB_BASE_URL}/movie/{tmdb_id}',
            params={'api_key': TMDB_API_KEY, 'language': 'en-US', 'append_to_response': 'videos,credits'},
            timeout=10
        )
        m = res.json()

        genres = [g['name'] for g in m.get('genres', [])]

        trailer = ''
        for video in m.get('videos', {}).get('results', []):
            if video.get('type') == 'Trailer' and video.get('site') == 'YouTube':
                trailer = f"https://www.youtube.com/watch?v={video['key']}"
                break

        cast = []
        for person in m.get('credits', {}).get('cast', [])[:10]:
            cast.append({
                'name': person.get('name', ''),
                'character': person.get('character', ''),
                'profile': f"{TMDB_IMG_URL}{person['profile_path']}" if person.get('profile_path') else ''
            })

        director = ''
        for person in m.get('credits', {}).get('crew', []):
            if person.get('job') == 'Director':
                director = person.get('name', '')
                break

        year_str = safe_year(m.get('release_date', ''))

        movie = {
            'tmdb_id': tmdb_id,
            'title': m.get('title', ''),
            'type': 'movie',
            'genre': ', '.join(genres),
            'genres': genres,
            'year': int(year_str) if year_str else None,
            'rating': round(m.get('vote_average', 0), 1),
            'poster': f"{TMDB_IMG_URL}{m['poster_path']}" if m.get('poster_path') else '',
            'backdrop': f"https://image.tmdb.org/t/p/original{m['backdrop_path']}" if m.get('backdrop_path') else '',
            'description': m.get('overview', ''),
            'release_date': m.get('release_date', ''),
            'runtime': m.get('runtime', 0),
            'trailer': trailer,
            'cast': cast,
            'director': director,
            'added_by': str(current_user['_id']),
            'created_at': datetime.utcnow().isoformat()
        }

        result = db.movies.insert_one(movie)
        movie['_id'] = str(result.inserted_id)

        return jsonify({'message': 'Movie imported successfully', 'movie': movie}), 201

    except Exception as e:
        return jsonify({'error': f'Import failed: {str(e)}'}), 500


# ============================================
# MOVIE ROUTES
# ============================================
@app.route('/api/movies', methods=['GET'])
@token_required
def get_movies(current_user):
    genre = request.args.get('genre')
    search = request.args.get('search')
    year_from = request.args.get('year_from')
    year_to = request.args.get('year_to')
    min_rating = request.args.get('min_rating')
    sort_by = request.args.get('sort', 'created_at')
    order = request.args.get('order', 'desc')

    query = {}

    # Genre filter - supports comma-separated genres (AND logic)
    if genre:
        genre_list = [g.strip() for g in genre.split(',') if g.strip()]
        if genre_list:
            genre_conditions = []
            for g in genre_list:
                genre_conditions.append({'genre': {'$regex': g, '$options': 'i'}})
            query['$and'] = genre_conditions

    # Search filter
    if search:
        if '$and' not in query:
            query['$and'] = []
        query['$and'].append({'title': {'$regex': search, '$options': 'i'}})

    # Year range filter
    if year_from:
        try:
            if '$and' not in query:
                query['$and'] = []
            query['$and'].append({'year': {'$gte': int(year_from)}})
        except ValueError:
            pass

    if year_to:
        try:
            if '$and' not in query:
                query['$and'] = []
            query['$and'].append({'year': {'$lte': int(year_to)}})
        except ValueError:
            pass

    # Min rating filter
    if min_rating:
        try:
            if '$and' not in query:
                query['$and'] = []
            query['$and'].append({'rating': {'$gte': float(min_rating)}})
        except ValueError:
            pass

    sort_order = -1 if order == 'desc' else 1
    valid_sorts = ['created_at', 'title', 'year', 'rating']
    if sort_by not in valid_sorts:
        sort_by = 'created_at'

    movies = []
    for movie in db.movies.find(query).sort(sort_by, sort_order):
        movies.append(serialize_movie(movie))
    return jsonify(movies), 200


@app.route('/api/movies/<movie_id>', methods=['GET'])
@token_required
def get_movie(current_user, movie_id):
    try:
        movie = db.movies.find_one({'_id': ObjectId(movie_id)})
    except:
        return jsonify({'error': 'Invalid ID format'}), 400
    if not movie:
        return jsonify({'error': 'Movie not found'}), 404
    return jsonify(serialize_movie(movie)), 200


@app.route('/api/movies', methods=['POST'])
@admin_required
def add_movie(current_user):
    data = request.json
    errors = validate_movie(data)
    if errors:
        return jsonify({'errors': errors}), 400

    movie = {
        'title':          data.get('title', '').strip(),
        'type':           data.get('type', 'movie'),
        'genre':          data.get('genre', '').strip(),
        'year':           int(data['year']) if data.get('year') else None,
        'rating':         float(data['rating']) if data.get('rating') else None,
        'poster':         data.get('poster', '').strip(),
        'backdrop':       data.get('backdrop', '').strip(),
        'description':    data.get('description', '').strip(),
        'trailer':        data.get('trailer', '').strip(),
        'director':       data.get('director', '').strip(),
        'cast':           data.get('cast', []),
        'runtime':        int(data['runtime']) if data.get('runtime') else None,
        'release_date':   data.get('release_date', '').strip(),
        'seasons':        data.get('seasons', []) if data.get('type') == 'show' else [],
        'total_episodes': int(data['total_episodes']) if data.get('total_episodes') and data.get('type') == 'show' else None,
        'added_by':       str(current_user['_id']),
        'created_at':     datetime.utcnow().isoformat()
    }

    result = db.movies.insert_one(movie)
    movie['_id'] = str(result.inserted_id)
    return jsonify(movie), 201


@app.route('/api/movies/<movie_id>', methods=['PUT'])
@admin_required
def update_movie(current_user, movie_id):
    data = request.json
    errors = validate_movie(data)
    if errors:
        return jsonify({'errors': errors}), 400

    update_data = {
        'title':          data.get('title', '').strip(),
        'type':           data.get('type', 'movie'),
        'genre':          data.get('genre', '').strip(),
        'year':           int(data['year']) if data.get('year') else None,
        'rating':         float(data['rating']) if data.get('rating') else None,
        'poster':         data.get('poster', '').strip(),
        'backdrop':       data.get('backdrop', '').strip(),
        'description':    data.get('description', '').strip(),
        'trailer':        data.get('trailer', '').strip(),
        'director':       data.get('director', '').strip(),
        'cast':           data.get('cast', []),
        'runtime':        int(data['runtime']) if data.get('runtime') else None,
        'release_date':   data.get('release_date', '').strip(),
        'seasons':        data.get('seasons', []) if data.get('type') == 'show' else [],
        'total_episodes': int(data['total_episodes']) if data.get('total_episodes') and data.get('type') == 'show' else None,
    }

    try:
        result = db.movies.update_one({'_id': ObjectId(movie_id)}, {'$set': update_data})
    except:
        return jsonify({'error': 'Invalid ID format'}), 400

    if result.matched_count == 0:
        return jsonify({'error': 'Movie not found'}), 404

    updated_movie = db.movies.find_one({'_id': ObjectId(movie_id)})
    return jsonify(serialize_movie(updated_movie)), 200


@app.route('/api/movies/<movie_id>', methods=['DELETE'])
@admin_required
def delete_movie(current_user, movie_id):
    try:
        result = db.movies.delete_one({'_id': ObjectId(movie_id)})
    except:
        return jsonify({'error': 'Invalid ID format'}), 400
    if result.deleted_count == 0:
        return jsonify({'error': 'Movie not found'}), 404

    db.watchlist.delete_many({'movie_id': movie_id})
    db.likes.delete_many({'movie_id': movie_id})
    db.user_ratings.delete_many({'movie_id': movie_id})
    db.watch_history.delete_many({'movie_id': movie_id})

    return jsonify({'message': 'Movie deleted successfully'}), 200


@app.route('/api/genres', methods=['GET'])
@token_required
def get_genres(current_user):
    all_genres = set()
    for movie in db.movies.find({}):
        if movie.get('genre'):
            for g in movie['genre'].split(','):
                g = g.strip()
                if g:
                    all_genres.add(g)
    genres = sorted(list(all_genres))
    return jsonify(genres), 200


# ============================================
# ADMIN ROUTES
# ============================================
@app.route('/api/admin/users', methods=['GET'])
@admin_required
def get_all_users(current_user):
    users = []
    for user in db.users.find().sort('created_at', -1):
        users.append(serialize_user(user))
    return jsonify(users), 200


@app.route('/api/admin/users/<user_id>/role', methods=['PUT'])
@admin_required
def update_user_role(current_user, user_id):
    data = request.json
    new_role = data.get('role', 'user')

    if new_role not in ['user', 'admin']:
        return jsonify({'error': 'Role must be user or admin'}), 400

    if str(current_user['_id']) == user_id and new_role != 'admin':
        return jsonify({'error': 'Cannot remove your own admin role'}), 400

    try:
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'role': new_role}}
        )
    except:
        return jsonify({'error': 'Invalid ID format'}), 400

    if result.matched_count == 0:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({'message': f'Role updated to {new_role}'}), 200


@app.route('/api/admin/users/<user_id>', methods=['DELETE'])
@admin_required
def delete_user(current_user, user_id):
    if str(current_user['_id']) == user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400

    try:
        result = db.users.delete_one({'_id': ObjectId(user_id)})
    except:
        return jsonify({'error': 'Invalid ID format'}), 400

    if result.deleted_count == 0:
        return jsonify({'error': 'User not found'}), 404

    db.watchlist.delete_many({'user_id': user_id})
    db.likes.delete_many({'user_id': user_id})
    db.user_ratings.delete_many({'user_id': user_id})
    db.watch_history.delete_many({'user_id': user_id})

    return jsonify({'message': 'User deleted'}), 200


@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def admin_stats(current_user):
    return jsonify({
        'total_users': db.users.count_documents({}),
        'total_movies': db.movies.count_documents({}),
        'total_likes': db.likes.count_documents({}),
        'total_ratings': db.user_ratings.count_documents({}),
        'total_watchlist': db.watchlist.count_documents({}),
        'total_history': db.watch_history.count_documents({})
    }), 200


# ============================================
# WATCHLIST ROUTES
# ============================================
@app.route('/api/watchlist', methods=['GET'])
@token_required
def get_watchlist(current_user):
    user_id = str(current_user['_id'])
    entries = list(db.watchlist.find({'user_id': user_id}))
    result = []
    for entry in entries:
        movie = db.movies.find_one({'_id': ObjectId(entry['movie_id'])})
        if movie:
            result.append({
                '_id': str(entry['_id']),
                'movie_id': entry['movie_id'],
                'movie': serialize_movie(movie),
                'added_at': entry.get('added_at', '')
            })
    return jsonify(result), 200


@app.route('/api/watchlist/<movie_id>', methods=['POST'])
@token_required
def add_to_watchlist(current_user, movie_id):
    user_id = str(current_user['_id'])
    try:
        movie = db.movies.find_one({'_id': ObjectId(movie_id)})
    except:
        return jsonify({'error': 'Invalid ID format'}), 400
    if not movie:
        return jsonify({'error': 'Movie not found'}), 404
    existing = db.watchlist.find_one({'user_id': user_id, 'movie_id': movie_id})
    if existing:
        return jsonify({'message': 'Already in watchlist'}), 200
    db.watchlist.insert_one({
        'user_id': user_id,
        'movie_id': movie_id,
        'added_at': datetime.utcnow().isoformat()
    })
    return jsonify({'message': 'Added to watchlist'}), 201


@app.route('/api/watchlist/<movie_id>', methods=['DELETE'])
@token_required
def remove_from_watchlist(current_user, movie_id):
    user_id = str(current_user['_id'])
    result = db.watchlist.delete_one({'user_id': user_id, 'movie_id': movie_id})
    if result.deleted_count == 0:
        return jsonify({'error': 'Not in watchlist'}), 404
    return jsonify({'message': 'Removed from watchlist'}), 200


# ============================================
# LIKES ROUTES
# ============================================
@app.route('/api/likes', methods=['GET'])
@token_required
def get_likes(current_user):
    user_id = str(current_user['_id'])
    entries = list(db.likes.find({'user_id': user_id}))
    result = []
    for entry in entries:
        movie = db.movies.find_one({'_id': ObjectId(entry['movie_id'])})
        if movie:
            result.append({
                '_id': str(entry['_id']),
                'movie_id': entry['movie_id'],
                'movie': serialize_movie(movie),
                'liked_at': entry.get('liked_at', '')
            })
    return jsonify(result), 200


@app.route('/api/likes/<movie_id>', methods=['POST'])
@token_required
def toggle_like(current_user, movie_id):
    user_id = str(current_user['_id'])
    try:
        movie = db.movies.find_one({'_id': ObjectId(movie_id)})
    except:
        return jsonify({'error': 'Invalid ID format'}), 400
    if not movie:
        return jsonify({'error': 'Movie not found'}), 404
    existing = db.likes.find_one({'user_id': user_id, 'movie_id': movie_id})
    if existing:
        db.likes.delete_one({'_id': existing['_id']})
        return jsonify({'message': 'Unliked', 'liked': False}), 200
    else:
        db.likes.insert_one({
            'user_id': user_id,
            'movie_id': movie_id,
            'liked_at': datetime.utcnow().isoformat()
        })
        return jsonify({'message': 'Liked', 'liked': True}), 201


# ============================================
# RATINGS ROUTES
# ============================================
@app.route('/api/ratings', methods=['GET'])
@token_required
def get_ratings(current_user):
    user_id = str(current_user['_id'])
    entries = list(db.user_ratings.find({'user_id': user_id}))
    result = []
    for entry in entries:
        movie = db.movies.find_one({'_id': ObjectId(entry['movie_id'])})
        if movie:
            result.append({
                '_id': str(entry['_id']),
                'movie_id': entry['movie_id'],
                'movie': serialize_movie(movie),
                'score': entry['score'],
                'rated_at': entry.get('rated_at', '')
            })
    return jsonify(result), 200


@app.route('/api/ratings/<movie_id>', methods=['POST'])
@token_required
def rate_movie(current_user, movie_id):
    user_id = str(current_user['_id'])
    data = request.json
    score = data.get('score') if data else None
    if score is None:
        return jsonify({'error': 'Score is required'}), 400
    try:
        score = float(score)
        if score < 0 or score > 10:
            return jsonify({'error': 'Score must be between 0 and 10'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Score must be a number'}), 400
    try:
        movie = db.movies.find_one({'_id': ObjectId(movie_id)})
    except:
        return jsonify({'error': 'Invalid ID format'}), 400
    if not movie:
        return jsonify({'error': 'Movie not found'}), 404

    db.user_ratings.update_one(
        {'user_id': user_id, 'movie_id': movie_id},
        {'$set': {
            'user_id': user_id,
            'movie_id': movie_id,
            'score': score,
            'rated_at': datetime.utcnow().isoformat()
        }},
        upsert=True
    )
    return jsonify({'message': 'Rating saved', 'score': score}), 200


@app.route('/api/ratings/<movie_id>', methods=['DELETE'])
@token_required
def delete_rating(current_user, movie_id):
    user_id = str(current_user['_id'])
    result = db.user_ratings.delete_one({'user_id': user_id, 'movie_id': movie_id})
    if result.deleted_count == 0:
        return jsonify({'error': 'Rating not found'}), 404
    return jsonify({'message': 'Rating removed'}), 200


# ============================================
# HISTORY ROUTES
# ============================================
@app.route('/api/history', methods=['GET'])
@token_required
def get_history(current_user):
    user_id = str(current_user['_id'])
    entries = list(db.watch_history.find({'user_id': user_id}).sort('watched_at', -1))
    result = []
    for entry in entries:
        movie = db.movies.find_one({'_id': ObjectId(entry['movie_id'])})
        if movie:
            result.append({
                '_id': str(entry['_id']),
                'movie_id': entry['movie_id'],
                'movie': serialize_movie(movie),
                'watched_at': entry.get('watched_at', '')
            })
    return jsonify(result), 200


@app.route('/api/history/<movie_id>', methods=['POST'])
@token_required
def add_to_history(current_user, movie_id):
    user_id = str(current_user['_id'])
    try:
        movie = db.movies.find_one({'_id': ObjectId(movie_id)})
    except:
        return jsonify({'error': 'Invalid ID format'}), 400
    if not movie:
        return jsonify({'error': 'Movie not found'}), 404

    db.watch_history.insert_one({
        'user_id': user_id,
        'movie_id': movie_id,
        'watched_at': datetime.utcnow().isoformat()
    })
    return jsonify({'message': 'Added to watch history'}), 201


@app.route('/api/history', methods=['DELETE'])
@token_required
def clear_history(current_user):
    user_id = str(current_user['_id'])
    result = db.watch_history.delete_many({'user_id': user_id})
    return jsonify({'message': f'Cleared {result.deleted_count} entries'}), 200


@app.route('/api/history/<movie_id>', methods=['DELETE'])
@token_required
def remove_from_history(current_user, movie_id):
    user_id = str(current_user['_id'])
    result = db.watch_history.delete_many({'user_id': user_id, 'movie_id': movie_id})
    if result.deleted_count == 0:
        return jsonify({'error': 'Not in history'}), 404
    return jsonify({'message': 'Removed from history'}), 200


# ============================================
# USER DATA FOR MOVIE
# ============================================
@app.route('/api/movies/<movie_id>/userdata', methods=['GET'])
@token_required
def get_movie_userdata(current_user, movie_id):
    user_id = str(current_user['_id'])
    is_liked = db.likes.find_one({'user_id': user_id, 'movie_id': movie_id}) is not None
    in_watchlist = db.watchlist.find_one({'user_id': user_id, 'movie_id': movie_id}) is not None
    rating_doc = db.user_ratings.find_one({'user_id': user_id, 'movie_id': movie_id})
    user_rating = rating_doc['score'] if rating_doc else None
    watch_count = db.watch_history.count_documents({'user_id': user_id, 'movie_id': movie_id})
    return jsonify({
        'liked': is_liked,
        'in_watchlist': in_watchlist,
        'user_rating': user_rating,
        'watch_count': watch_count
    }), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)