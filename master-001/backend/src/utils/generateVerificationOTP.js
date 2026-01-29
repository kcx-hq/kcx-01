export const generateVerificationOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  return { otp, expires };
}