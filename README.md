# Django PWA Offline Tasks

This project is a Django-based Progressive Web App (PWA) for managing tasks with offline support. It uses Django REST Framework for the backend API and service workers for offline capabilities, allowing users to create, view, and sync tasks even without an internet connection.

## Features
- User authentication (login/register/logout)
- Create, view, and manage tasks
- Offline support using IndexedDB and service workers
- Automatic sync of tasks when back online
- Responsive and modern UI

## Project Structure
```
architecture.md
manage.py
core/
    models.py
    views.py
    serializers.py
    ...
django_pwa/
    settings.py
    urls.py
    ...
static/
    js/
        sw.js
        offline.js
    css/
    images/
templates/
    index.html
```

## Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd pwa
   ```
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Apply migrations:**
   ```bash
   python manage.py migrate
   ```
4. **Run the development server:**
   ```bash
   python manage.py runserver
   ```
5. **Access the app:**
   Open your browser and go to `http://localhost:8000/`

## PWA & Offline Functionality
- The service worker (`static/js/sw.js`) caches static assets and the main HTML page for offline use.
- Tasks are stored in IndexedDB when offline and synced with the server when back online.
- The app can be installed on mobile and desktop for a native-like experience.

## Customization
- Update `core/models.py` to change task fields or add new models.
- Modify `static/js/offline.js` for custom offline logic.
- Edit `templates/index.html` for UI changes.

## License
MIT License
