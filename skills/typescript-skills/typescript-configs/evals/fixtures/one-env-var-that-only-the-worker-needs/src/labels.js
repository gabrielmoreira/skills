import { settings } from "./settings.js";

export function createLabelWriter(deps) {
  return {
    async print(consignment) {
      return deps.printer.send(settings.labelPrinterHost, {
        reference: consignment.reference,
        depot: consignment.depotCode,
      });
    },
  };
}
