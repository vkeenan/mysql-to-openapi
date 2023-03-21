# MySQL to OpenAPI

MySQL to OpenAPI is a simple script that generates an OpenAPI 2.0 (formerly known as Swagger) YAML file from your MySQL database schema. The generated YAML file will include definitions for each table in your schema, as well as basic CRUD operations for each table.

## Prerequisites

* Node.js (12.x or later)
* MySQL database with an existing schema

## Setup
Clone the repository:
sh
Copy code
git clone https://github.com/vkeenan/mysql-to-openapi.git
cd mysql-to-openapi
Install the required dependencies:
sh
Copy code
npm install
Create a .env file in the project root folder with the following variables:
ini
Copy code
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
Replace your_database_host, your_database_user, your_database_password, and your_database_name with the appropriate values for your MySQL database.

Usage
To generate the OpenAPI YAML file, run the following command:

sh
Copy code
node index.js
The script will generate a YAML file named after your database schema (e.g., your_database_name.yaml) in the project root folder. This file will contain the OpenAPI 2.0 definitions and paths for your MySQL schema.

Output
The generated YAML file will include:

Basic CRUD operations (GET, POST, PUT, DELETE) for each table
Model definitions for each table in camelCase
Model definitions for request and response objects
Parameters and responses objects for each table
You can import the generated YAML file into your favorite API development tool, such as Swagger UI or Postman, to interact with your API or generate client libraries.

Customization
The script can be easily customized to fit your specific needs. You may modify the index.js file to add custom paths, responses, or other OpenAPI components. Additionally, you can modify the createBasicPathDefinition function to generate different API paths or adjust the naming conventions used in the generated file.

License
This project is licensed under the MIT License. See the LICENSE file for details.