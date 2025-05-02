const asyncHandler = require('express-async-handler')
const { getAccessToken } = require('../middleware/paypalMiddleware.js')
const axios = require('axios')

const createPaypalOrder = asyncHandler(async (req, res) => {
    let { amount } = req.body
    amount = String(amount)
    const accessToken = await getAccessToken();
  
    const order = await axios.post(`${process.env.PAYPAL_API}/v2/checkout/orders`, {
      intent: 'CAPTURE',
      application_context: {
        return_url: 'https://mignite.net/paypal/success',  
        cancel_url: 'https://mignite.net/paypal/cancel',   
      },
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount
        }
      }]
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  
    const approvalUrl = order.data.links.find(link => link.rel === 'approve').href;
    res.json({ approvalUrl });
  })


// const captureOrder = asyncHandler(async (req, res) => {
//     const { token } = req.query;

//     const accessToken = await getAccessToken();
    
//     const capture = await axios.post(
//       `${process.env.PAYPAL_API}/v2/checkout/orders/${token}/capture`,
//       {},
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );
  
//     res.json({ success: true, data: capture.data });

// })


const captureOrder = asyncHandler(async (req, res) => {
    const { token } = req.query;  
  
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required.',
      });
    }
  
    const accessToken = await getAccessToken();  
  
   
    const orderDetails = await axios.get(
      `${process.env.PAYPAL_API}/v2/checkout/orders/${token}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  

    if (orderDetails.data.status === 'COMPLETED') {
      
      const orderId = orderDetails.data.id;  
      return res.status(400).json({
        success: false,
        message: 'This order has already been captured.',
        orderId: orderId,  
      });
    }
  
 
    if (orderDetails.data.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: `Order status is not APPROVED. Current status: ${orderDetails.data.status}`,
      });
    }
  
   
    const capture = await axios.post(
      `${process.env.PAYPAL_API}/v2/checkout/orders/${token}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  

    const orderId = capture.data.id;  
  

    res.json({
      success: true,
      message: 'Order captured successfully.',
      paypalOrderId: orderId,  
      token: token, 
      data: capture.data,  
    });
  });
  
  

  module.exports = {
    createPaypalOrder,
    captureOrder
  }
  