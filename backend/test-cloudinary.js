const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dto1riyyi',
  api_key: '845761329711658',
  api_secret: 'uH5m1-Gx0YmvPoBKEqOt0UNmGMo'
});

cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', {
  folder: 'test'
}).then(res => {
  console.log('UPLOAD SUCCESS:', res.url);
}).catch(err => {
  console.error('UPLOAD FAILED:', err.message);
});
