import React, { useState, useEffect } from 'react';
import plantumlEncoder from 'plantuml-encoder';
import { Download, Loader2, AlertCircle } from 'lucide-react';

interface PlantUMLViewerProps {
  code: string;
  title?: string;
  description?: string;
  fileName?: string;
}

const PlantUMLViewer: React.FC<PlantUMLViewerProps> = ({
  code,
  title = "PlantUML Diagram",
  description = "Visual representation",
  fileName = "diagram"
}) => {
  const [plantUmlCode, setPlantUmlCode] = useState<string>('');
  const [svgUrl, setSvgUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const extractPlantUmlCode = (input: string): string => {
      if (!input) return '';
      // Support markdown code blocks
      const markdownRegex = /```plantuml\s*([\s\S]*?)```/;
      const markdownMatch = markdownRegex.exec(input);
      if (markdownMatch) {
        return markdownMatch[1].trim();
      }
      // Support raw plantuml with @startuml/@enduml
      if (input.includes('@startuml')) {
        return input.trim();
      }
      // Fallback: if it doesn't have tags but looks like puml code, wrap it?
      // For now, let's just return as is if it looks like code
      return input.trim();
    };

    try {
      const extractedCode = extractPlantUmlCode(code);
      setPlantUmlCode(extractedCode);
      if (extractedCode) {
        renderDiagram(extractedCode);
      } else {
        setError('No valid PlantUML code found. Make sure it contains @startuml or is wrapped in markdown blocks.');
        setLoading(false);
      }
    } catch (e) {
      console.error('Error extracting PlantUML code:', e);
      setError('Failed to process PlantUML code');
      setLoading(false);
    }
  }, [code]);

  const renderDiagram = (umlCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const encoded = plantumlEncoder.encode(umlCode);
      const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;
      setSvgUrl(url);
      setLoading(false);
    } catch (err) {
      console.error('Error encoding PlantUML:', err);
      setError(`Failed to encode diagram: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (svgUrl) {
      const a = document.createElement('a');
      a.href = svgUrl;
      a.download = `${fileName}.svg`;
      a.target = "_blank";
      a.click();
    }
  };

  const handleDownloadCode = () => {
    if (plantUmlCode) {
      const blob = new Blob([plantUmlCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.puml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-grow">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-orange-100 text-xs">{description}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadImage}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title="Download as SVG"
            >
              <Download className="w-4 h-4" />
              SVG
            </button>
            <button
              onClick={handleDownloadCode}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title="Download source code"
            >
              <Download className="w-4 h-4" />
              Code
            </button>
          </div>
        </div>

        <div className="flex-grow p-6 flex flex-col items-center justify-center overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-gray-500 text-sm">Rendering diagram...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-700 font-medium mb-1">Rendering Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow-inner min-w-full min-h-full flex items-center justify-center">
              <img 
                src={svgUrl} 
                alt="PlantUML Diagram" 
                className="max-w-full"
                onError={() => setError('Failed to load diagram image from PlantUML server. Please check your internet connection.')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantUMLViewer;
