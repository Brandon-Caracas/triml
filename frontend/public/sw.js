// Service Worker para Web Push Notifications

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || '/icon.png', // Fallback local icon si no viene del server
      badge: '/badge.png', // Un icon pequeño blanco en bg transparente (Android)
      vibrate: [200, 100, 200, 100, 200, 100, 200], // Vibración distintiva
      data: data.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Extraer la URL del payload de la notificación, con fallback a la raíz
  const urlToOpen = event.notification.data?.url || '/peluquero';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Si la ventana ya está abierta, enfocarse en ella y redirigir
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no existe ninguna ventana abierta con esa URL, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
