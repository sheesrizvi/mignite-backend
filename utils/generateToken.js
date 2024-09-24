const jwt = require("jsonwebtoken");

const generateTokenStream = (id) => {
  // return jwt.sign(
  //   { id },
  //  'rpgmt5zwt2dhjbwcx2z322bvgtdepnhp2hwms8jzpm265xnyjzxdgrn96484xaf4',
  //   {
  //     expiresIn: "1d",
  //   }
  // );
};

const generateTokenAdmin = (id, name, email, type,age) => {
  return jwt.sign({ id, name, email, type,age }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};
const generateTokenUser = (id, name, email, shippingAddress, phone, age) => {
  return jwt.sign(
    { id, name, email, shippingAddress, phone, age },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};
const generateTokenInstructor = (id, name, email, type, age) => {
  return jwt.sign(
    {
      id,
      name,
      email,
      type,
      age
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

module.exports = {
  generateTokenAdmin,
  generateTokenUser,
  generateTokenInstructor,
  generateTokenStream
};
