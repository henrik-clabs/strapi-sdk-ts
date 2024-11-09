import { AxiosRequestConfig } from "../node_modules/axios/index"
import Strapi, { StrapiClientArgs } from "../src/index"

var propertiesReader = require("properties-reader")
var properties = propertiesReader(".env.local")

const options: StrapiClientArgs = {
  baseUrl: properties.get("STRAPI_URL"),
  apiKey: properties.get("STRAPI_API_KEY"),
}

var client:Strapi

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


beforeAll( () => {
    client = new Strapi(options)
})
beforeEach( () => {
    jest.retryTimes(0)
})

describe('Strapi CRUD', () => {


test('basic', async () => {
    try{
        const result = await client.findOne("test",0)
    } catch (error: any) {
        // if (error && typeof(error)=='object') {
        // console.log("Error", Object.keys(error),error['name'],error['code'],error['address'])
        // if (error['name']=="AggregateError") {
        //     console.log("AggregateError[0]",Object.keys(error.errors[0]),error.errors[0].errno,error.errors[0].code,error.errors[0].address,error.errors[0].port)
        //     console.log("AggregateError[1]",Object.keys(error.errors[1]),error.errors[1].errno,error.errors[1].code,error.errors[1].address,error.errors[1].port)
        // }
        // }
        const b=(error['code'] == "ECONNREFUSED" || error['code'] == "ERR_BAD_REQUEST")
        expect(b).toBeTruthy()
    }
  });


  test('basic-author', async () => {
        const result0 = await client.findAll("authors",as_filter(eq("name","David Doe")))
        expect(result0.data.data.length).toBe(1)
        const result1 = await client.findAll("authors",as_filter(eq("name","David DoeXX")))
        expect(result1.data.data.length).toBe(0)
        const result2 = await client.findAll("authors",as_filter(eq("name","Sarah Baker")))
        expect(result2.data.data.length).toBe(1)
        const result3 = await client.findAll("authors",as_filter(and(eq("name","David Doe"),eq("name","Sarah Baker"))))
        expect(result3.data.data.length).toBe(0)
        const result4 = await client.findAll("authors",as_filter(or(eq("name","David Doe"),eq("name","Sarah Baker"))))
        expect(result4.data.data.length).toBe(2)
});

test('basic-author-crud', async () => {
    const data = {
        "name": "Sdk Testuser",
        "email": "sdktestuser@noemail.io",
    }

    // Check test user does not exist
    const result0 = await client.findAll("authors",as_filter(eq("name",data.name)))
    expect(result0.data.data.length).toBe(0)

    // Create testuser
    const result1 = await client.create("authors", {data})
    //console.log(result1)
    expect(result1.status).toBe(201)
    expect(result1.data.data.documentId).toBeDefined()

    // Check testuser was created
    const result2 = await client.findAll("authors",as_filter(eq("name","Sdk Testuser")))
    expect(result2.data.data.length).toBe(1)

    const data1 = {
        "name": "Sdk Testuser",
        "email": "sdktestuser@noemail.com", // change email only
    }
    const result3 = await client.update("authors",result1.data.data.documentId, {data:data1} )
    //console.log(result3)
    expect(result3.status).toBe(200)

    // Check update happened
    const result4 = await client.findAll("authors",as_filter(eq("name","Sdk Testuser")))
    expect(result4.data.data.length).toBe(1)
    expect(result4.data.data[0].email).toBe(data1.email)
    expect(result4.data.data[0].documentId).toBe(result1.data.data.documentId)

    // Check update happened
    const result5 = await client.findOne("authors",result1.data.data.documentId)
    //console.log(result5)
    expect(result5.status).toBe(200)
    expect(result5.data.data.name).toBe(data.name)
    expect(result5.data.data.name).toBe(data1.name)
    expect(result5.data.data.email).toBe(data1.email)


    // Delete testuser
    const result6 = await client.delete("authors",result1.data.data.documentId)
    expect(result6.status).toBe(204)
    expect(result6.deleted).toBeTruthy()
    
    // Check Delete happened
    const result7 = await client.findAll("authors",as_filter(eq("name",data.name)))
    expect(result7.data.data.length).toBe(0)
    
});

})
