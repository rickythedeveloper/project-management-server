interface APIResponse { isSuccessful: boolean }
interface APISuccessNoData extends APIResponse { isSuccessful: true }
interface APISuccessWithData<T> extends APIResponse { isSuccessful: true; result: T }
interface APIError extends APIResponse { isSuccessful: false; error: string }

export type GetResponse<T> = APISuccessWithData<T> | APIError;
export type PostResponse<T> = APISuccessWithData<T> | APIError;
export type PutResponse = APISuccessNoData | APIError;
export type DeleteResponse = APISuccessNoData | APIError;
