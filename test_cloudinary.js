const cloudinary = require('cloudinary').v2;
cloudinary.config({cloud_name: 'dzppk5ylt', api_key: '233541925611646', api_secret: 'H2useqpzEgpULnc3Qf-q1S0Euf8'});
cloudinary.search.expression('folder:"Ahmed Elakad"').execute().then(r => console.log(JSON.stringify(r))).catch(console.error);
