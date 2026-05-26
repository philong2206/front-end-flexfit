const fs = require('fs');
const http = require('http');

http.get('http://localhost:5023/swagger/v1/swagger.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const swagger = JSON.parse(data);
      let md = '# Current Backend API Audit\n\n';
      
      for (const [path, methods] of Object.entries(swagger.paths)) {
        for (const [method, details] of Object.entries(methods)) {
          md += `## \`${method.toUpperCase()}\` ${path}\n`;
          if (details.tags && details.tags.length > 0) {
            md += `- **Controller**: ${details.tags[0]}\n`;
          }
          
          let requestBodyType = 'None';
          if (details.requestBody && details.requestBody.content && details.requestBody.content['application/json']) {
            const schema = details.requestBody.content['application/json'].schema;
            if (schema['$ref']) {
              requestBodyType = schema['$ref'].split('/').pop();
            } else if (schema.type) {
              requestBodyType = schema.type;
            }
          }
          md += `- **Request Body**: ${requestBodyType}\n`;
          
          let responseType = 'Unknown';
          if (details.responses && details.responses['200'] && details.responses['200'].content && details.responses['200'].content['application/json']) {
            const schema = details.responses['200'].content['application/json'].schema;
            if (schema['$ref']) {
              responseType = schema['$ref'].split('/').pop();
            } else if (schema.type) {
              responseType = schema.type;
              if (schema.type === 'array' && schema.items && schema.items['$ref']) {
                responseType = `Array<${schema.items['$ref'].split('/').pop()}>`;
              }
            }
          } else if (details.responses && details.responses['200']) {
            responseType = details.responses['200'].description || 'OK';
          }
          md += `- **Response**: ${responseType}\n\n`;
        }
      }
      
      fs.writeFileSync('C:/Users/Admin/.gemini/antigravity-ide/brain/c0b6604f-2f80-4255-ada8-a597eb61f6a8/AUDIT_CURRENT_API.md', md);
      console.log('Successfully generated AUDIT_CURRENT_API.md');
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
  });
}).on('error', err => {
  console.error('Error fetching swagger:', err);
});
