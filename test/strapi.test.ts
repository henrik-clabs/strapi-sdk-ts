import { and, as_filter, eq, or, StrapiSdk, StrapiSdkClientArgs } from "../src/index"

var propertiesReader = require("properties-reader")
var properties = propertiesReader(".env.local")

const optionssdk: StrapiSdkClientArgs = {
  baseUrl: properties.get("STRAPI_URL"),
  apiKey: properties.get("STRAPI_API_KEY")
}

var client:StrapiSdk

beforeAll( () => {
    client  = new StrapiSdk(optionssdk)
})

describe('Strapi SDK predicates', () => {
  test('eq', () => {
    expect(eq("nameX","Sdk Testuser")).toEqual({nameX:{$eq:"Sdk Testuser"}})
    expect(as_filter(eq("nameX","Sdk Testuser"))).toEqual({params: {filters: {nameX:{$eq:"Sdk Testuser"}}}})
  })

  test('and', () => {
    expect(and(eq("first","logan"), eq("last","droid"))).toEqual({$and:[{first: {$eq: "logan"}},{last: {$eq: "droid"}}]})
  })

  test('or', () => {
    expect(or(eq("first","logan"), eq("last","droid"))).toEqual({$or:[{first: {$eq: "logan"}},{last: {$eq: "droid"}}]})
  })

  test('andor', () => {
    // This shows why the helpers exists
    expect(and(or(eq("first","logan"),eq("nameX","Sdk Testuser")),eq("last","droid"))).toEqual(
      {
        $and:  [
          {
            $or:  [
              {
                first:  {
                  $eq: "logan",
                },
              },
              {
                nameX:  {
                  $eq: "Sdk Testuser",
                },
              },
            ],
          },
          {
            last:  {
              $eq: "droid",
            },
          },
        ],
      }
  )
})
})

describe('Strapi SDK CRUD', () => {


test('basic', async () => {
      const result = await client.findOne("test","0")
      expect(result.status).toBe(404)  // test api: 404 Not found 

      // Check testuser was created
      const result1 = await client.findAll("authors",eq("nameX","Sdk Testuser"))
      //console.log("result1", Object.keys(result1), result1.data)
      expect(result1.status).toBe(400) // 400 validation error. Invalid key nameX

      // result1 [ 'data', 'status' ] 
      // result1.data {
      //   data: null,
      //   error: {
      //     status: 400,
      //     name: 'ValidationError',
      //     message: 'Invalid key nameX',
      //     details: { key: 'nameX', path: null, source: 'query', param: 'filters' }
      //   }
      // }

    });


  test('basic-author', async () => {
        const result0 = await client.findAll("authors",eq("name","David Doe"))
        expect(result0.status).toBe(200)
        expect(result0.data.data.length).toBe(1)
        const result1 = await client.findAll("authors",eq("name","David DoeXX"))
        expect(result1.status).toBe(200)
        expect(result1.data.data.length).toBe(0)
        const result2 = await client.findAll("authors",eq("name","Sarah Baker"))
        expect(result2.status).toBe(200)
        expect(result2.data.data.length).toBe(1)
        const result3 = await client.findAll("authors",and(eq("name","David Doe"),eq("name","Sarah Baker")))
        expect(result3.status).toBe(200)
        expect(result3.data.data.length).toBe(0)
        const result4 = await client.findAll("authors",or(eq("name","David Doe"),eq("name","Sarah Baker")))
        expect(result4.status).toBe(200)
        expect(result4.data.data.length).toBe(2)
});

test('basic-author-crud', async () => {
    const data = {
        "name": "Sdk Testuser",
        "email": "sdktestuser@noemail.io",
    }

    // Check test user does not exist
    const result0 = await client.findAll("authors",eq("name",data.name))
    expect(result0.status).toBe(200)
    expect(result0.data.data.length).toBe(0)

    // Create testuser
    const result1 = await client.create("authors", {data})
    //console.log(result1)
    expect(result1.status).toBe(201)
    expect(result1.data.data.documentId).toBeDefined()

    // Check testuser was created
    const result2 = await client.findAll("authors",eq("name","Sdk Testuser"))
    expect(result2.status).toBe(200)
    expect(result2.data.data.length).toBe(1)

    const data1 = {
        "name": "Sdk Testuser",
        "email": "sdktestuser@noemail.com", // change email only
    }
    const result3 = await client.update("authors",result1.data.data.documentId, {data:data1} )
    expect(result3.status).toBe(200)

    // Check update happened
    const result4 = await client.findAll("authors",eq("name","Sdk Testuser"))
    expect(result4.status).toBe(200)
    expect(result4.data.data.length).toBe(1)
    expect(result4.data.data[0].email).toBe(data1.email)
    expect(result4.data.data[0].documentId).toBe(result1.data.data.documentId)

    // Check update happened
    const result5 = await client.findOne("authors",result1.data.data.documentId)
    expect(result5.status).toBe(200)
    expect(result5.data.data.name).toBe(data.name)
    expect(result5.data.data.name).toBe(data1.name)
    expect(result5.data.data.email).toBe(data1.email)
    expect(result5.data.data.email).not.toBe(data.email)

    // Delete testuser
    const result6 = await client.delete("authors",result1.data.data.documentId)
    //console.log(result6)
    expect(result6.status).toBe(204)
    expect(result6.deleted).toBeTruthy()

    // elete testuser again should fail
    const result6a = await client.delete("authors",result1.data.data.documentId)
    // console.log(result6a)
    expect(result6a.status).toBe(404)
    expect(result6a.deleted).not.toBeTruthy()
    
    // Check Delete happened
    const result7 = await client.findAll("authors",as_filter(eq("name",data.name)))
    expect(result7.data.data.length).toBe(0)
 
    // Check Delete happened
    const result8 = await client.findOne("authors",result1.data.data.documentId)
    expect(result8.status).toBe(404)
    
});

})
