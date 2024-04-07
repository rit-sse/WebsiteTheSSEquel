# Postman Testing Workflow

Github actions will set up a database and server to run Postman tests against.

## Creating Tests

### Download Postman

[Official Postman Download Page](https://www.postman.com/downloads/)

### Import Tests

The API tests used for this workflow are contained in `postman/WebsitetheSSEQuelTests.postman_collection.json`.

Use the `import` button or drag the file in to import the tests into a workspace.

### Write Tests

In the postman interface for a single request, tests are written in javascript under the `tests` tab. You can read more about how to do so [here](https://learning.postman.com/docs/writing-scripts/test-scripts/).

Here is a small example test to assert an expected response body from a request:

```js
pm.test("Assert Expected value for <your request>", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.eql("Your JSON here");
});
```

> ##### Errors Running Locally?
>
> API Tests verify that the expected data is returned from API calls. This means that if your local database contains
> unexpected modifications, API calls will fail to produce expected behavior. If you are experiencing failures when testing
> locally, try running `npx prisma db seed`

### Export Tests

To export tests, find the three horizontal dots next to `WebsiteTheSSEquelTests` in the workplace explorer. Click them and then click export in the dropdown. Select the `Collection v2.1` format and select the `postman/WebsitetheSSEQuelTests.postman_collection.json` file in this repository to replace it.
