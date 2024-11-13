/**
 * Strapi_sdk.ts is a convience wrapper for Strapi's v5 restAPI.
 * 
 * The following methods are implemented
 *   - findOne, findAll, update, delete, create
 * 
 * ## Installation
 * ```bash npm2yarn
 * npm install strapi-sdk-ts
 * ```
 * 
 * ## Usage
 * 
 * const options: StrapiSdkClientArgs = {
 *     baseUrl: properties.get("STRAPI_URL"),
 *     apiKey: properties.get("STRAPI_API_KEY")
 *   }
 * 
 * const client:StrapiSdk=new StrapiSdk(options)
 * 
 * :::caution Note
 * By default StrapiSDK does **not** throw errors. It will always return a status field.
 * :::
 * 
 * ### Filtering
 * 
 * To assist with filtering when querying Strapi some additional helpers:
 * - and, or, eq
 * 
 * @example
 * const res = await findAll('names',eq("name",data.name))
 * 
 * ## TODO
 * - Support populate
 * - Nested filtering
 * - Pagination (findNext?)
 * - Upload media
 * 
 * @module strapi-sdk-ts
 */
// @ts-ignore
import { AxiosRequestConfig } from 'axios';
import { Strapi, StrapiClientArgs, StrapiDeleteResponse, StrapiResponse } from "./strapi"

export interface StrapiSdkClientArgs {
    baseUrl?: string;
    apiKey?: string;
}

const sdkAxiosConfigOption: StrapiClientArgs = {

    axiosOptions:{ // https://axios-http.com/docs/req_config
        validateStatus: function (status: number) {
          //console.log("validateStatus ",status)
          return true // always return a status. Never throw errors.
        }}
}

/**
 * Used for Strapi filtering
 */
export type StrapiPredicate = any

/**
 * Equal predicate for Strapi Filters.
 *
 * @example
 * const name_filter = eq("name","logan")
 * // { name: { $eq: "logan" }}
 *
 * @param ...parms : column, value
 * @returns StrapiPredicate { column: { $eq: value }}
 */
export function eq(...parms: any): StrapiPredicate {
  const out = {} as StrapiPredicate
  const name = parms[0]
  const value = parms[1]

  // @ts - expect-error Parameter 'name' implicitly has an 'any' type.ts(7006)
  out[name] = { $eq: value }
  return out
}

/**
 * And predicate function for Strapi Filter
 *
 * @example
 * const fullname = and( eq("first","logan"), eq("last","droid"))
 * // { $and:[{first: {$eq: "logan"}},{last: {$eq: "droid"}}]}
 *
 * @param parms : elements to by joined by AND
 * @returns StrapiPredicate {$and:[p1, p2 ...]}
 */
export function and(...parms: any): StrapiPredicate {
  const out = { $and: Array.from(arguments) } as StrapiPredicate
  return out
}

/**
 * Or predicate function for Strapi Filter
 *
 * @example
 * const fullname = or( eq("first","logan"), eq("last","droid"))
 * // { $or:[{first: {$eq: "logan"}},{last: {$eq: "droid"}}]}
 *
 * @param parms : elements to by joined by AND
 * @returns StrapiPredicate {$and:[p1, p2 ...]}
 */export function or(...parms: any): StrapiPredicate {
    const out = { $or: Array.from(arguments) } as StrapiPredicate
    return out
  }
  
/**
 * Create filter parameter for Strapi Requests
 * Can be used with Strapi's predicates, like or, and, eq.
 *
 * @example
 * const user = await client.findAll("auth-users", as_filter(eq("email","a.b@email.com")))
 * const user = await client.findAll("auth-users", as_filter(and(eq("email","a.b@email.com"),eq("name","Amorikie"))))
 *
 * @param predicates
 * @returns Pick<AxiosRequestConfig, params> {params: {filters: { predicates }}}
 */
export function as_filter(
  predicates: StrapiPredicate
): Pick<AxiosRequestConfig, "params"> {
  return { params: { filters: predicates } }
}

/**
 * Access layer for Strapi CMS v5
 * Uses low-level API (strapi.ts) for access
 */
export class StrapiSdk  {
    #client: Strapi

    constructor(params?: StrapiSdkClientArgs) {
        sdkAxiosConfigOption.apiKey=params?.apiKey
        sdkAxiosConfigOption.baseUrl=params?.baseUrl
        this.#client = new Strapi(sdkAxiosConfigOption)
    }

    /**
     * Fetches a single resource by its documentId from the specified endpoint using an HTTP GET request.
     *
     * @template T - The type of the data expected in the response. Defaults to `any` if not specified.
     *
     * @param {string} resource - The resource path or endpoint from which to fetch the data.
     * @param {string} docid - The unique identifier of the resource to be fetched.
     *
     * @returns {Promise<StrapiResponse<T>>} - A promise that resolves to an object containing the `data`
     *                                               of type `T` and the HTTP status code of the response.
     *                                         Always check status to validate success or failure of request.
     *
     * @example
     * // Fetches a user with a known documentId from the 'users' resource
     * res = await findOne('users',data.documentId)
     * if (res.status == 200) // success
     *   ..
     * else
     *   .. Handle error
     *   .. 404: Not Found
     */
    async findOne<T = any>(
        resource: string,
        docid: string
    ): Promise<StrapiResponse<T>> {
        return await this.#client.findOne(resource,docid)
    }

    /**
     * Fetches all resources from the specified endpoint using an HTTP GET request.
     *
     * @template T - The type of the data expected in the response. Defaults to `any` if not specified.
     *
     * @param {string} resource - The resource path or endpoint from which to fetch the data.
     * @param {StrapiPredicate} [config] - Optional filtering of returned results.
     *
     * @returns {Promise<StrapiResponse<T>>} - A promise that resolves to an object containing the `data`
     *                                               of type `T` and the HTTP status code of the response.
     */
    async findAll<T =any>(
        resource: string,
        config?: StrapiPredicate
      ): Promise<StrapiResponse<T>> {
        if (!config)
        return await this.#client.findAll(resource)
        else if ("params" in config) // AxiosRequestConfig
        return await this.#client.findAll(resource, config)
        else
        return await this.#client.findAll(resource,as_filter(config))
      }

    /**
     * Creates a new resource at the specified endpoint using an HTTP POST request.
     *
     * @template T - The type of the data expected in the response. Defaults to `any` if not specified.
     *
     * @param {string} resource - The resource path or endpoint where the new data will be created.
     * @param {any} body - The data to be sent in the body of the request for creating the resource.
     *
     * @returns {Promise<StrapiResponse<T>>} - A promise that resolves to an object containing the `data`
     *                                               of type `T` and the HTTP status code of the response.
     *     
     */
    async create<T = any>(resource: string, body: any): Promise<StrapiResponse<T>> {
            return await this.#client.create(resource, body);
    }

    /**
     * Updates an existing resource at the specified endpoint using an HTTP PUT request.
     *
     * @template T - The type of the data expected in the response. Defaults to `any` if not specified.
     *
     * @param {string} resource - The resource path or endpoint where the resource will be updated.
     * @param {string} docid - The unique documentId of the resource to be updated.
     * @param {any} updatedData - The new data to be sent in the body of the request for updating the resource.
     *
     * @returns {Promise<StrapiResponse<T>>} - A promise that resolves to an object containing the `data`
     *                                               of type `T` and the HTTP status code of the response.
     */
    async update<T = any>(
        resource: string,
        docid: string,
        updatedData: any
    ): Promise<StrapiResponse<T>> {
        return await this.#client.update(resource, docid, updatedData);
    }

    /**
     * Deletes a resource at the specified endpoint using an HTTP DELETE request.
     *
     * @param {string} resource - The resource path or endpoint from which the data will be deleted.
     * @param {string} docid - The unique documentId of the resource to be deleted.
     *
     * @returns {Promise<StrapiDeleteResponse>} - A promise that resolves to an object containing the HTTP
     *                                                 status code and a boolean indicating whether the deletion
     *                                                 was successful.
     */
    async delete(resource: string, docid: string): Promise<StrapiDeleteResponse> {
        // TODO: if status is 404 (not found). could be a "resource" not found as well as "docid" not found.
        const chk = await this.findOne(resource, docid)
        if (chk.status == 200) // found
            return await this.#client.delete(resource, docid);
        
        return {status:chk.status, deleted: false}
    }
}