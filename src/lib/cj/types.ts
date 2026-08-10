export interface CjApiResponse<T = unknown> {
  code: number;
  result?: boolean;
  success?: boolean;
  message: string;
  data: T;
  requestId?: string;
}

export interface CjTokenData {
  accessToken: string;
  accessTokenExpiryDate?: string;
  refreshToken?: string;
  refreshTokenExpiryDate?: string;
}

export interface CjProductListItem {
  id: string;
  nameEn: string;
  sku?: string;
  spu?: string;
  bigImage?: string;
  sellPrice?: string | number;
  nowPrice?: string | number;
  discountPrice?: string | number;
  threeCategoryName?: string;
  oneCategoryName?: string;
  warehouseInventoryNum?: number;
  description?: string;
  deliveryCycle?: string;
}

export interface CjVariant {
  vid: string;
  variantName?: string;
  variantNameEn?: string;
  variantImage?: string;
  variantSku?: string;
  variantSellPrice?: number | string;
  variantPrice?: number | string;
  variantWeight?: number;
  variantVolume?: number;
  variantStock?: number;
  variantKey?: string;
  variantKeyEn?: string;
}

export interface CjProductDetail {
  pid: string;
  productName?: string;
  productNameEn?: string;
  productSku?: string;
  productImage?: string;
  productImageSet?: string[];
  description?: string;
  descriptionEn?: string;
  sellPrice?: number | string;
  categoryName?: string;
  productWeight?: number;
  variants?: CjVariant[];
}

export interface CjFreightOption {
  logisticName: string;
  logisticPrice?: number;
  postage?: number;
  totalPostage?: number;
  aging?: string;
  ages?: string;
}
