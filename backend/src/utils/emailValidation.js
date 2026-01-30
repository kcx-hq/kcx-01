export const isValidEmail = (email) => {
  return (
    typeof email === "string" &&
    email.includes("@") &&
    email.includes(".")
  );
};
