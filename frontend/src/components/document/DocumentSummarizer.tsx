import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFileText, FiX, FiCopy, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface DocumentSummary {
  content: string;
  summary: string;
  key_points: string[];
  timestamp: string;
}

const DocumentSummarizer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'key-points'>('summary');
  const [copied, setCopied] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [textInput, setTextInput] = useState('');

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    await processFile(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const processFile = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/documents/summarize-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to process document');
      }

      const data = await response.json();
      setSummary(data);
      toast.success('Document processed successfully!');
    } catch (error: any) {
      console.error('Error processing document:', error);
      toast.error(error.message || 'Failed to process document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) {
      toast.error('Please enter some text to summarize');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/documents/summarize-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: textInput }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to summarize text');
      }

      const data = await response.json();
      setSummary(data);
      toast.success('Text summarized successfully!');
    } catch (error: any) {
      console.error('Error summarizing text:', error);
      toast.error(error.message || 'Failed to summarize text');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Document Summarizer</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Input */}
        <div className="space-y-4">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-2">
              <FiUpload className="w-12 h-12 text-gray-400" />
              <p className="text-gray-600">
                {isDragActive ? 'Drop the file here' : 'Drag & drop a document here, or click to select'}
              </p>
              <p className="text-sm text-gray-500">Supported formats: PDF, TXT, DOCX (max 10MB)</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div>
              <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-1">
                Enter text to summarize
              </label>
              <textarea
                id="text-input"
                ref={textAreaRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Paste your text here..."
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !textInput.trim()}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading || !textInput.trim()
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Processing...' : 'Summarize Text'}
            </button>
          </form>
        </div>

        {/* Right Column - Output */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Summary Results</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : summary ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      activeTab === 'summary' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('key-points')}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      activeTab === 'key-points' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Key Points
                  </button>
                </div>
                <button
                  onClick={() => copyToClipboard(
                    activeTab === 'summary' ? summary.summary : summary.key_points.join('\n')
                  )}
                  className="text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-gray-100"
                  title="Copy to clipboard"
                >
                  {copied ? <FiCheck className="w-5 h-5" /> : <FiCopy className="w-5 h-5" />}
                </button>
              </div>

              <div className="bg-white p-4 rounded-md border border-gray-200 h-64 overflow-y-auto">
                {activeTab === 'summary' ? (
                  <p className="text-gray-700 whitespace-pre-line">{summary.summary}</p>
                ) : (
                  <ul className="space-y-2 list-disc list-inside">
                    {summary.key_points.map((point, index) => (
                      <li key={index} className="text-gray-700">{point}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="text-xs text-gray-500">
                <p>Generated on: {formatDate(summary.timestamp)}</p>
                {summary.content.length > 1000 && (
                  <p className="mt-1">
                    <span className="font-medium">Note:</span> Original content truncated for display.
                    Document was {Math.ceil(summary.content.length / 1000)}KB.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
              <FiFileText className="w-12 h-12 mb-3 text-gray-300" />
              <p>Your document summary will appear here.</p>
              <p className="text-sm mt-1">Upload a document or enter text to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentSummarizer;
