# 🚀 Typing Speed Test Website

A modern, interactive typing speed and accuracy test website built with Python Flask and modern web technologies.

## ✨ Features

- **Random Paragraph Generation**: 10 different engaging paragraphs for varied typing practice
- **Real-time Tracking**: Live WPM and accuracy updates as you type
- **Visual Feedback**: Character-by-character highlighting (correct, incorrect, current position)
- **Comprehensive Results**: Detailed breakdown of speed, accuracy, time, and errors
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful gradient design with smooth animations

## 🎯 Project Objectives

- Generate random typing test paragraphs dynamically
- Provide interactive typing interface with real-time feedback
- Calculate and display typing speed (WPM)
- Calculate and display accuracy percentage
- Provide instant feedback and comprehensive results

## 🛠️ System Requirements

### Software Requirements
- **Programming Language**: Python 3.7+
- **Framework**: Flask 2.3.3
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: None (stateless application)

### Hardware Requirements
- **Processor**: Any modern CPU
- **RAM**: 2GB minimum
- **Storage**: 100MB free space

## 📁 Project Structure

```
tp/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # Project documentation
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── style.css         # CSS styling
    └── script.js         # JavaScript functionality
```

## 🚀 Installation & Setup

### 1. Clone or Download the Project
```bash
# If using git
git clone <repository-url>
cd tp

# Or simply download and extract the project files
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Application
```bash
python app.py
```

### 4. Open Your Browser
Navigate to: `http://localhost:5000`

## 🎮 How to Use

1. **Start the Test**: Click the "Start Test" button
2. **Type the Paragraph**: A random paragraph will appear for you to type
3. **Real-time Feedback**: Watch your WPM and accuracy update as you type
4. **Complete the Test**: Type until you reach the end of the paragraph
5. **View Results**: See your detailed performance metrics
6. **Try Again**: Click "Take Another Test" for a new challenge

## 🔧 Modules

### 1. Paragraph Generator Module
- Stores 10 diverse paragraphs
- Randomly selects one for each test
- Covers various topics and difficulty levels

### 2. Typing Input Module
- Real-time text input monitoring
- Character-by-character validation
- Prevents editing after completion

### 3. Speed Calculation Module
- WPM calculation (Words Per Minute)
- Formula: `WPM = (Typed characters / 5) / Time in minutes`
- Assumes average word length of 5 characters

### 4. Accuracy Calculation Module
- Character-by-character comparison
- Formula: `Accuracy = (Correct characters / Total characters) × 100`
- Real-time accuracy updates

### 5. Results Display Module
- Comprehensive results dashboard
- Speed, accuracy, time, and error metrics
- Option to retry or start new tests

## 🎨 Technologies Used

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Styling**: Custom CSS with modern design principles
- **Responsiveness**: Mobile-first CSS Grid and Flexbox
- **Animations**: CSS keyframes and transitions
- **Fonts**: Google Fonts (Inter)

## 📱 Responsive Design Features

- **Mobile-First Approach**: Optimized for all screen sizes
- **Flexible Layout**: CSS Grid and Flexbox for adaptive layouts
- **Touch-Friendly**: Large buttons and input areas for mobile devices
- **Readable Typography**: Optimized font sizes for all devices

## 🔮 Future Enhancements

- [ ] User authentication system
- [ ] Performance history and statistics
- [ ] Leaderboard functionality
- [ ] Multiple difficulty levels
- [ ] Support for multiple languages
- [ ] Custom paragraph input
- [ ] Export results functionality
- [ ] Dark/Light theme toggle

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change port in app.py
   app.run(debug=True, port=5001)
   ```

2. **Dependencies Not Found**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Browser Compatibility**
   - Ensure JavaScript is enabled
   - Use modern browsers (Chrome, Firefox, Safari, Edge)

## 📊 Performance Metrics

The application calculates:
- **WPM (Words Per Minute)**: Typing speed measurement
- **Accuracy**: Percentage of correctly typed characters
- **Time Taken**: Total duration of the test
- **Error Count**: Number of incorrect characters

## 🤝 Contributing

Feel free to contribute to this project by:
- Reporting bugs
- Suggesting new features
- Submitting pull requests
- Improving documentation

## 📄 License

This project is open source and available under the MIT License.

## 🎉 Conclusion

This typing test website provides an effective platform for users to practice and improve their typing skills. With its modern design, real-time feedback, and comprehensive results, it offers an engaging way to measure and enhance typing proficiency.

---

**Happy Typing!** 🎯⌨️
