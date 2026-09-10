export function buildGenerativeAIPdfHtml(generatedContent: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Generated Content</title>
      <style>
        body { font-family: var(--font-dm-sans), "DM Sans", sans-serif; line-height: 1.6; margin: 40px; }
        h1, h2, h3 { color: #333; }
        ul, ol { margin: 10px 0; }
        li { margin: 5px 0; }
        p { margin: 10px 0; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        blockquote { border-left: 4px solid #ddd; margin: 10px 0; padding-left: 20px; }
        code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
      </style>
    </head>
    <body>
      ${generatedContent}
    </body>
    </html>
  `;
}

export function buildGenerativeAIWordHtml(generatedContent: string) {
  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Generated Content</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>90</w:Zoom>
          <w:DoNotPromptForConvert/>
          <w:DoNotShowRevisions/>
          <w:DoNotPrintRevisions/>
          <w:DisplayHorizontalDrawingGridEvery>0</w:DisplayHorizontalDrawingGridEvery>
          <w:DisplayVerticalDrawingGridEvery>2</w:DisplayVerticalDrawingGridEvery>
          <w:UseMarginsForDrawingGridOrigin/>
          <w:ValidateAgainstSchemas/>
          <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
          <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
          <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
          <w:Compatibility>
            <w:BreakWrappedTables/>
            <w:SnapToGridInCell/>
            <w:WrapTextWithPunct/>
            <w:UseAsianBreakRules/>
            <w:DontGrowAutofit/>
          </w:Compatibility>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body { font-family: var(--font-dm-sans), "DM Sans", "IBM Plex Sans Thai", sans-serif; line-height: 1.6; font-size: 11pt; }
        h1, h2, h3 { color: #333; font-weight: 600; }
        h1 { font-size: 18pt; margin: 20px 0 10px 0; }
        h2 { font-size: 16pt; margin: 18px 0 8px 0; }
        h3 { font-size: 14pt; margin: 16px 0 6px 0; }
        ul, ol { margin: 10px 0; padding-left: 20px; }
        li { margin: 5px 0; }
        p { margin: 10px 0; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 10pt; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: 600; }
        blockquote { border-left: 4px solid #ddd; margin: 10px 0; padding-left: 20px; font-style: italic; }
        code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
        strong { font-weight: 600; }
        em { font-style: italic; }
      </style>
    </head>
    <body>
      ${generatedContent}
    </body>
    </html>
  `;
}
