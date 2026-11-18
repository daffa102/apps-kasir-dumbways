import * as midtransClient from "midtrans-client";


const serverKey = process.env.MIDTRANS_SERVER_KEY;
const clientKey = process.env.MIDTRANS_CLIENT_KEY;

if (!serverKey || !clientKey) {
  throw new Error("MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY wajib diisi");
}

const snap = new midtransClient.Snap({
    isProduction: false,
    clientKey,
    serverKey
});


export default snap;