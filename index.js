const fs = require("fs");
const mysql = require("mysql");
const yaml = require("js-yaml");
require("dotenv").config();

const connection = mysql.createConnection({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
});

function toCamelCase(str) {
  if (str.toLowerCase() === "id") {
    return "ID";
  }

  let camelCaseStr = str
    .toLowerCase()
    .replace(/(?:^|_)./g, (match) =>
      match.charAt(match.length - 1).toUpperCase()
    );

  if (camelCaseStr.endsWith("id")) {
    camelCaseStr = camelCaseStr.slice(0, -2) + "ID";
  }

  const mappings = [
    { from: /address$/gi, to: "Address" },
    { from: /assignment$/gi, to: "Assignment" },
    { from: /by/gi, to: "By" },
    { from: /category/gi, to: "Category" },
    { from: /certificate$/gi, to: "Certificate" },
    { from: /code/gi, to: "Code" },
    { from: /company/gi, to: "Company" },
    { from: /date/gi, to: "Date" },
    { from: /industry/gi, to: "Industry" },
    { from: /lesson/gi, to: "Lesson" },
    { from: /method/gi, to: "Method" },
    { from: /modified/gi, to: "Modified" },
    { from: /name/gi, to: "Name" },
    { from: /phone/gi, to: "Phone" },
    { from: /progress/gi, to: "Progress" },
    { from: /project/gi, to: "Project" },
    { from: /section/gi, to: "Section" },
    { from: /status/gi, to: "Status" },
    { from: /topic/gi, to: "Topic" },
    { from: /url$/gi, to: "URL" },
  ];
  mappings.forEach((mapping) => {
    camelCaseStr = camelCaseStr.replace(mapping.from, mapping.to);
  });

  return camelCaseStr;
}

function mapDataType(dataType) {
  switch (dataType) {
    case "tinyint":
    case "smallint":
    case "mediumint":
    case "int":
    case "bigint":
      return "integer";
    case "float":
    case "double":
    case "decimal":
      return "number";
    case "date":
    case "datetime":
    case "timestamp":
    case "time":
    case "year":
      return "string";
    case "char":
    case "varchar":
    case "tinytext":
    case "mediumtext":
    case "text":
    case "longtext":
      return "string";
    case "binary":
    case "varbinary":
    case "tinyblob":
    case "mediumblob":
    case "blob":
    case "longblob":
      return "string";
    case "enum":
    case "set":
      return "string";
    default:
      return "string";
  }
}

function createBasicPathDefinition(tableName) {
  const pluralTableName = tableName.endsWith("s") ? tableName : `${tableName}s`;
  const camelCaseTableName = toCamelCase(tableName);
  const pluralCamelCaseTableName = toCamelCase(pluralTableName);

  return {
    [`/${pluralTableName.toLowerCase()}`]: {
      get: {
        summary: `Get a list of ${pluralCamelCaseTableName}`,
        operationId: `get${pluralCamelCaseTableName}`,
        responses: {
          200: {
            description: "OK",
          },
        },
      },
      post: {
        summary: `Create a new ${camelCaseTableName}`,
        operationId: `create${camelCaseTableName}`,
        parameters: [
          {
            $ref: `#/parameters/${camelCaseTableName}Request`,
          },
        ],
        responses: {
          201: {
            description: "Created",
          },
        },
      },
    },
    [`/${pluralTableName.toLowerCase()}/{id}`]: {
      get: {
        summary: `Get a specific ${camelCaseTableName}`,
        operationId: `get${camelCaseTableName}ById`,
        parameters: [
          {
            name: "id",
            in: "path",
            description: `ID of the ${camelCaseTableName} to fetch`,
            required: true,
            type: "integer",
          },
        ],
        responses: {
          200: {
            description: "OK",
          },
        },
      },
      put: {
        summary: `Update an existing ${camelCaseTableName}`,
        operationId: `update${camelCaseTableName}`,
        parameters: [
          {
            name: "id",
            in: "path",
            description: `ID of the ${camelCaseTableName} to update`,
            required: true,
            type: "integer",
          },
        ],
        responses: {
          200: {
            description: "OK",
          },
        },
      },
      delete: {
        summary: `Delete a ${camelCaseTableName}`,
        operationId: `delete${camelCaseTableName}`,
        parameters: [
          {
            name: "id",
            in: "path",
            description: `ID of the ${camelCaseTableName} to delete`,
            required: true,
            type: "integer",
          },
        ],
        responses: {
          204: {
            description: "No Content",
          },
        },
      },
    },
  };
}

connection.connect((err) => {
  if (err) throw err;

  const dbName = process.env.DB_NAME;

  const query = `
    SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `;

  connection.query(query, [dbName], (err, results) => {
    if (err) throw err;

    const openapiDefinitions = {};
    const openapiPaths = {};
    const openapiResponses = {};
    const openapiParameters = {};

    results.forEach((row) => {
      const tableName = row.TABLE_NAME;
      const camelTableName = toCamelCase(tableName);
      const columnName = toCamelCase(row.COLUMN_NAME);
      const dataType = mapDataType(row.DATA_TYPE);
      const allowNull = row.IS_NULLABLE === "YES";

      if (!openapiDefinitions[camelTableName]) {
        openapiDefinitions[camelTableName] = {
          type: "object",
          properties: {},
        };
      }

      openapiParameters[`${camelTableName}Request`] = {
        description: `An array of new ${camelTableName} records`,
        in: "body",
        name: `${camelTableName.toLowerCase()}Request`,
        required: true,
        schema: {
          $ref: `#/definitions/${camelTableName}Request`,
        },
      };

      openapiResponses[`${camelTableName}Response`] = {
        description: `${camelTableName} Response Object`,
        headers: {
          "Access-Control-Allow-Origin": {
            type: "string",
          },
          "Cache-Control": {
            type: "string",
          },
        },
        schema: {
          $ref: `#/definitions/${camelTableName}Response`,
        },
      };

      openapiDefinitions[`${camelTableName}Request`] = {
        type: "object",
        description: `An array of ${camelTableName} objects`,
        properties: {
          Data: {
            type: "array",
            items: {
              $ref: `#/definitions/${camelTableName}`,
            },
          },
        },
      };

      openapiDefinitions[`${camelTableName}Response`] = {
        type: "object",
        description: `An array of ${camelTableName} objects`,
        properties: {
          Data: {
            type: "array",
            items: {
              $ref: `#/definitions/${camelTableName}`,
            },
          },
        },
      };

      openapiDefinitions[camelTableName].properties[columnName] = {
        type: dataType,
        ...(allowNull ? { "x-nullable": true } : {}),
      };

      if (!openapiPaths.hasOwnProperty(tableName)) {
        const lowerCaseTableName = tableName.toLowerCase();
        const paths = createBasicPathDefinition(lowerCaseTableName);
        Object.assign(openapiPaths, paths);
      }
    });

    const openapiOutput = {
      swagger: "2.0",
      info: {
        title: `${dbName} OpenAPI 2.0 generated by mysql-to-openapi`,
        version: "0.1.0",
      },
      parameters: openapiParameters,
      responses: openapiResponses,
      paths: openapiPaths,
      definitions: openapiDefinitions,
    };

    fs.writeFileSync(`swagger/${dbName}.yaml`, yaml.dump(openapiOutput));
    console.log(`OpenAPI YAML for ${dbName} has been generated.`);
    connection.end();
  });
});
