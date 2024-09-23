const mongoose = require('mongoose');
const orderSchema = mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
  
      orderCourses: [
        {
          name: { type: String, required: true },
          price: { type: Number, required: true },
          course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
          },
          livecourse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LiveCourse",
          },
          instructor: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Instructor",
          },
          finalprice: { type: Number, required: true },
        },
      ],
      
      emailDelivery: {
        type: String,
      },
      itemsPrice: {
        type: Number,
      },
      paymentMethod: {
        type: String,
        required: true,
      },
      invoiceId: {
        type: String,
      },
      isPaid: {
        type: Boolean,
      },
      totalPrice: {
        type: Number,
        required: true,
      },
      paidAt: {
        type: Date,
      },
      deliveryStatus: {
        type: String,
        enum: ["Enrolled", "In Progress", "Completed", "Cancelled"],
        default: "Enrolled",
      },
     
      notes: {
        type: String,
        required: false,
      },
      discountedValue: {
        type: Number
      }
    },
    {
      timestamps: true,
    }
  );
  
const Order = mongoose.model("Order", orderSchema);
  
module.exports = Order