// @ts-ignore
import { AxiosRequestConfig } from 'axios';
import Strapi, { StrapiClientArgs, StrapiDeleteResponse, StrapiResponse } from "./index"

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

export function or(...parms: any): StrapiPredicate {
    const out = { $or: Array.from(arguments) } as StrapiPredicate
    return out
  }
  
/**
 * Create filter parameter for Strapi Requests
 * Can be used with predicates for And and Eq
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
 * Access layer for Strapi CMS
 * Uses low-level API (strapi.ts) for access
 */
export class Strapi_Sdk  {
    #client: Strapi

    constructor(params?: StrapiSdkClientArgs) {
        sdkAxiosConfigOption.apiKey=params?.apiKey
        sdkAxiosConfigOption.baseUrl=params?.baseUrl
        this.#client = new Strapi(sdkAxiosConfigOption)
    }

    async findOne<T = any>(
        resource: string,
        docid: string
    ): Promise<StrapiResponse<T>> {
        return await this.#client.findOne(resource,docid)
    }

    async findAll(
        resource: string,
        config: StrapiPredicate
      ) {
        if ("params" in config) // AxiosRequestConfig
        return await this.#client.findAll(resource, config)
        else
        return await this.#client.findAll(resource,as_filter(config))
      }

    async create<T = any>(resource: string, body: any): Promise<StrapiResponse<T>> {
            return await this.#client.create(resource, body);
    }

    async update<T = any>(
        resource: string,
        docid: string,
        updatedData: any
    ): Promise<StrapiResponse<T>> {
        return await this.#client.update(resource, docid, updatedData);
    }

    async delete(resource: string, docid: string): Promise<StrapiDeleteResponse> {
        // TODO: if status is 404 (not found). could be a "resource" not found as well as "docid" not found.
        const chk = await this.findOne(resource, docid)
        if (chk.status == 200) // found
            return await this.#client.delete(resource, docid);
        
        return {status:chk.status, deleted: false}
    }
}