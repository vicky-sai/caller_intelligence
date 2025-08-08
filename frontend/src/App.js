import React, { useState, useRef } from 'react';
import WordCloud from 'react-d3-cloud';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        audioChunks.current = [];
        await sendForTranscription(audioBlob);
      };
      mediaRecorder.current.start();
      setIsRecording(true);
      setTranscription('');
      setAnalysis(null);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const sendForTranscription = async (audioBlob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    try {
      const response = await fetch('http://127.0.0.1:5001/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const data = await response.json();
      setTranscription(data.transcription);
      setAnalysis(data.analysis);
    } catch (error) {
      console.error("Error during transcription:", error);
      setTranscription('Error: Could not transcribe audio.');
    } finally {
      setIsLoading(false);
    }
  };

  const getWordCloudData = (text) => {
    if (!text) return [];

    const stopWords = new Set([
      "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours",
      "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself",
      "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this",
      "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being",
      "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and",
      "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with",
      "about", "against", "between", "into", "through", "during", "before", "after", "above",
      "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again",
      "further", "then", "once", "here", "there", "when", "where", "why", "how", "all",
      "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor",
      "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will",
      "just", "don", "should", "now", "thank", "you", "plus", "gandhi's", "also", "lot"
    ]);

    const words = text.toLowerCase().match(/\w+/g) || [];
    const wordFrequencies = words.reduce((acc, word) => {
      if (!stopWords.has(word) && isNaN(word)) {
        acc[word] = (acc[word] || 0) + 1;
      }
      return acc;
    }, {});

    const data = Object.keys(wordFrequencies).map(key => ({ text: key, value: wordFrequencies[key] }));
    return data;
  };
  
  // Memoize the data so it's not recalculated on every render
  const wordCloudData = React.useMemo(() => getWordCloudData(transcription), [transcription]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Truecaller Caller Intelligence</h1>
        <div className="controls">
          {!isRecording ? (
            <button onClick={startRecording}>Start Record</button>
          ) : (
            <button onClick={stopRecording}>End Record</button>
          )}
        </div>
      </header>
      <main>
        {isLoading && <div className="loading">Processing...</div>}
        {transcription && (
          <div className="dashboard">
            <div className="transcription-section">
              <h2>Transcription</h2>
              <p>{transcription}</p>
            </div>
            {analysis && (
              <div className="analysis-section">
                <h2>Analysis</h2>
                <div className="analysis-grid">
                  <div className="analysis-item">
                    <h3>Sentiment</h3>
                    <p>{analysis.sentiment}</p>
                  </div>
                  <div className="analysis-item">
                    <h3>Topics</h3>
                    <ul>
                      {analysis.topics && analysis.topics.map((topic, index) => <li key={index}>{topic}</li>)}
                    </ul>
                  </div>
                  <div className="analysis-item">
                    <h3>Intent</h3>
                    <p>{analysis.intent}</p>
                  </div>
                  <div className="analysis-item">
                    <h3>Entities</h3>
                    <ul>
                      {analysis.entities && analysis.entities.map((entity, index) => <li key={index}>{entity}</li>)}
                    </ul>
                  </div>
                  <div className="analysis-item full-width">
                    <h3>Follow-up Actions</h3>
                    <ul>
                      {analysis.follow_up_actions && analysis.follow_up_actions.map((action, index) => <li key={index}>{action}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <div className="wordcloud-section">
              <h2>Word Cloud</h2>
              <div className="wordcloud-wrapper">
                {wordCloudData.length > 0 && (
                  <WordCloud
                    data={wordCloudData}
                    width={500}
                    height={300}
                    font="Verdana"
                    fontSize={(word) => 10 + word.value * 25}
                    rotate={0}
                    padding={5}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;