type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER" | "BARISTA";
};
