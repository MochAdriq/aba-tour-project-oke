import Swal from "sweetalert2";

const BRAND_GREEN = "#0f5f3a";
const BRAND_GOLD = "#c9a227";
const INK = "#0f172a";

const baseConfig = {
  confirmButtonText: "Baik",
  customClass: {
    popup: "aba-swal-popup",
    title: "aba-swal-title",
    htmlContainer: "aba-swal-text",
    confirmButton: "aba-swal-confirm",
    cancelButton: "aba-swal-cancel",
  },
  buttonsStyling: false,
  background: "#ffffff",
  color: INK,
};

const readMessage = (error, fallbackMessage) =>
  error?.response?.data?.error || fallbackMessage;

export const notifySuccess = (title, text = "") =>
  Swal.fire({
    ...baseConfig,
    icon: "success",
    iconColor: BRAND_GREEN,
    title,
    text,
  });

export const notifyError = (title, text = "") =>
  Swal.fire({
    ...baseConfig,
    icon: "error",
    title,
    text,
    confirmButtonColor: "#b42318",
  });

export const notifyWarning = (title, text = "") =>
  Swal.fire({
    ...baseConfig,
    icon: "warning",
    iconColor: BRAND_GOLD,
    title,
    text,
  });

export const notifyInfo = (title, text = "") =>
  Swal.fire({
    ...baseConfig,
    icon: "info",
    title,
    text,
  });

export const notifyApiError = (error, fallbackMessage, title = "Terjadi Kesalahan") =>
  notifyError(title, readMessage(error, fallbackMessage));

export const confirmAction = async ({
  title,
  text = "",
  confirmButtonText = "Ya, lanjutkan",
  cancelButtonText = "Batal",
  icon = "warning",
}) => {
  const result = await Swal.fire({
    ...baseConfig,
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
  });
  return result.isConfirmed;
};
