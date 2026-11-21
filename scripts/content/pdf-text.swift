// Extract the text of every PDF page with macOS PDFKit, for cross-checking Danish text only.
// (PDFKit returns the Persian scrambled: reversed order and presentation forms. Never use it for Persian.)
//
//   swift scripts/content/pdf-text.swift docs/resources/PD3_Mundtlig_Delproeve2.pdf .cache/content/booklet/text
//   swift scripts/content/pdf-text.swift .cache/content/sources/siri-2024-maj/document.pdf .cache/content/sources/siri-2024-maj/text
//
// Output: <outDir>/page-001.txt … (raw extraction output; .cache/ is gitignored, never commit it).
import Foundation
import PDFKit

let args = CommandLine.arguments
guard args.count == 3 else {
    FileHandle.standardError.write("usage: swift pdf-text.swift <file.pdf> <outDir>\n".data(using: .utf8)!)
    exit(2)
}
guard let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
    FileHandle.standardError.write("cannot open \(args[1])\n".data(using: .utf8)!)
    exit(1)
}
let outDir = args[2]
try FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)
for i in 0..<doc.pageCount {
    let text = doc.page(at: i)?.string ?? ""
    let path = (outDir as NSString).appendingPathComponent(String(format: "page-%03d.txt", i + 1))
    try text.write(toFile: path, atomically: true, encoding: .utf8)
}
print("extracted \(doc.pageCount) pages to \(outDir)")
