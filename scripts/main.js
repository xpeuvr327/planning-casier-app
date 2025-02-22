import QrScanner from '../lib/qr-scanner.min.js';
const QrScanner = new QrScanner(
    videoElem,
    result => console.log('decoded qr code:', result),
);