class offlineDB {
    constructor(){
        this.dbName = 'offlineDB';
        this.version = 1;
        this.db=null
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result
                resolve(this.db)
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                 if (!db.objectStoreNames.contains('tasks')) {
                    const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
                    taskStore.createIndex('user', 'user', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('pending_ops')) {
                    db.createObjectStore('pending_ops', { keyPath: 'id', autoIncrement: true });
                }
            }
        })
    }

    async addPendingOperation(operation, data) {
        const transaction = this.db.transaction(['pending_ops'], 'readwrite');
        const store = transaction.objectStore('pending_ops');
        
        await store.add({
            operation,
            data,
            timestamp: new Date().toISOString()
        });
    }

    async getAllTasks() {
        const transaction = this.db.transaction(['tasks'], 'readonly');
        const store = transaction.objectStore('tasks');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveTask(task) {
        const transaction = this.db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        await store.put(task);
    }
}

// Main application logic
class TaskManager {
    constructor() {
        this.db = new OfflineDB();
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncWhenOnline();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineNotification();
        });
    }

    async init() {
        await this.db.init();
        await this.loadTasks();
        
        if ('serviceWorker' in navigator) {
            await navigator.serviceWorker.register('/static/js/sw.js');
        }
    }

    async createTask(taskData) {
        const task = {
            id: generateUUID(),
            ...taskData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced: false
        };

        await this.db.saveTask(task);
        
        await this.db.addPendingOperation('create', task);
        
        if (this.isOnline && !this.syncInProgress) {
            this.syncWhenOnline();
        }
        
        return task;
    }

    async syncWhenOnline() {
        if (!this.isOnline || this.syncInProgress) return;
        
        this.syncInProgress = true;
        
        try {
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('background-sync');
            } else {
                await this.performSync();
            }
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    showOfflineNotification() {
        const notification = document.createElement('div');
        notification.className = 'offline-notification';
        notification.textContent = 'You are offline. Changes will sync when connection is restored.';
        document.body.appendChild(notification);
    }
}
