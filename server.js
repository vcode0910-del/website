const express = require('express');
const midtransClient = require('midtrans-client');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// CONFIGURATION (Dapatkan dari Dashboard Midtrans Anda)
let snap = new midtransClient.Snap({
    isProduction: false, // Ubah ke true jika sudah live
    serverKey: 'YOUR_SERVER_KEY_DISINI',
    clientKey: 'YOUR_CLIENT_KEY_DISINI'
});

// ENDPOINT UNTUK MEMBUAT TRANSAKSI
app.post('/api/create-transaction', async (req, res) => {
    try {
        let parameter = {
            "transaction_details": {
                "order_id": "ORDER-" + Math.round(new Date().getTime() / 1000),
                "gross_amount": req.body.amount
            },
            "enabled_payments": ["qris", "gopay", "shopeepay"],
            "credit_card": { "secure": true }
        };

        const transaction = await snap.createTransaction(parameter);
        // transactionToken dan redirect_url (untuk QRIS/Payment Page) dikirim ke frontend
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// WEBHOOK (Untuk mengecek pembayaran masuk otomatis)
app.post('/api/webhook', (req, res) => {
    let notificationJson = req.body;
    snap.transaction.notification(notificationJson)
        .then((statusResponse) => {
            let orderId = statusResponse.order_id;
            let transactionStatus = statusResponse.transaction_status;

            if (transactionStatus == 'settlement'){
                console.log(`Pembayaran Berhasil untuk Order: ${orderId}`);
                // DI SINI: Tambahkan logika kirim produk otomatis ke email/WA user
            }
            res.status(200).send('OK');
        });
});

app.listen(3000, () => console.log('Server berjalan di port 3000'));
