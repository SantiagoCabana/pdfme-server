import { image } from '@pdfme/schemas';

console.log("image plugin keys:", Object.keys(image));
if (image.propPanel) {
  console.log("propPanel schema:", JSON.stringify(image.propPanel.schema, null, 2));
  console.log("propPanel uiSchema:", JSON.stringify(image.propPanel.uiSchema, null, 2));
}
