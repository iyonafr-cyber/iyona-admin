import { createHttpClient, type IyonaHttpClientConfig } from "@iyona/api-client";
import axiosInstance from "./axios";

export type HttpClientConfig = IyonaHttpClientConfig;

export const httpClient = createHttpClient(axiosInstance);
