import { createHttpClient, type JarvisHttpClientConfig } from "@jarvis/api-client";
import axiosInstance from "./axios";

export type HttpClientConfig = JarvisHttpClientConfig;

export const httpClient = createHttpClient(axiosInstance);
