const axios = require('axios')
let paypalToken = null;
let tokenExpiry = 0; 


const getAccessToken = async () => {
  const now = Date.now();


  if (paypalToken && now < tokenExpiry) {
    return paypalToken;
  }


  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await axios.post(
    `${process.env.PAYPAL_API}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  paypalToken = response.data.access_token;


  tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;

  return paypalToken;
};

const validateAndCapturePaypalOrder = async (paypalToken) => {
    if (!paypalToken) {
      throw new Error('PayPal token is required.');
    }
  
    const accessToken = await getAccessToken();
  
    const orderDetails = await axios.get(
      `${process.env.PAYPAL_API}/v2/checkout/orders/${paypalToken}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const orderStatus = orderDetails.data.status;
    if (orderStatus === 'COMPLETED') {
      return {
        status: 'already_completed',
        paypalOrderId: orderDetails.data.id,
      };
    }
  
    if (orderStatus !== 'APPROVED') {
      throw new Error(`Order status is not APPROVED. Current status: ${orderStatus}`);
    }
  

    const capture = await axios.post(
      `${process.env.PAYPAL_API}/v2/checkout/orders/${paypalToken}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  
    const captureId = capture.data.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const paypalOrderId = capture.data.id;
    const captureStatus = capture.data.status;
  
    if (captureStatus !== 'COMPLETED') {
      throw new Error('Payment capture failed.');
    }
  
    return {
      status: 'captured',
      paypalOrderId,
      paypalCaptureId: captureId,
    };
  };
  

module.exports = {
    getAccessToken,
    validateAndCapturePaypalOrder
}