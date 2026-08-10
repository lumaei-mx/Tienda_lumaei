/**
 * CJ Dropshipping — punto de entrada.
 * Auth + productos + órdenes en src/lib/cj/*
 */
export {
  isCjConfigured,
  testCjConnection,
  getAccessToken,
  isCjBalanceError,
  isCjOrderExistsError,
} from "./cj/client";
export {
  searchCjProducts,
  importCjProduct,
  getCjProductDetail,
  mapCjToProduct,
} from "./cj/products";
export {
  createCjOrder,
  fulfillOrderViaCj as fulfillOrder,
  getCjTracking,
  calculateFreight,
} from "./cj/orders";
