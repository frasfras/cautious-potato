# Requirements Document

## Introduction

This feature enables users to dynamically load CSV files containing racing telemetry data through a file input interface. When a new CSV file is loaded, the Racing Line Visualizer will parse the data and update the visualization to display the new lap data, including GPS coordinates, racing line, and car animation.

## Glossary

- **RacingLineVisualizer**: The React component that displays GPS track data, racing line visualization, and animated car position
- **CSV File**: A comma-separated values file containing telemetry data with columns including timestamp, telemetry_name, and telemetry_value
- **GPS Points**: Latitude and longitude coordinates extracted from VBOX_Lat_Min and VBOX_Long_Minutes telemetry fields
- **File Input**: An HTML input element of type "file" that allows users to select files from their local filesystem
- **Telemetry Data**: Time-series data from vehicle sensors including GPS coordinates, speed, acceleration, steering angle, and other metrics

## Requirements

### Requirement 1

**User Story:** As a racing analyst, I want to load different CSV files containing lap data, so that I can compare and analyze multiple laps without reloading the application

#### Acceptance Criteria

1. THE RacingLineVisualizer SHALL display a file input control that accepts CSV files
2. WHEN the user selects a CSV file through the file input, THE RacingLineVisualizer SHALL parse the file contents
3. WHEN the CSV file is successfully parsed, THE RacingLineVisualizer SHALL extract GPS coordinates from VBOX_Lat_Min and VBOX_Long_Minutes fields
4. WHEN new GPS points are extracted, THE RacingLineVisualizer SHALL update the visualization to display the new racing line
5. WHEN the visualization updates, THE RacingLineVisualizer SHALL reset the car animation to the start position

### Requirement 2

**User Story:** As a user, I want immediate visual feedback when loading a new file, so that I know the system is processing my data

#### Acceptance Criteria

1. WHEN the user selects a file, THE RacingLineVisualizer SHALL display a loading indicator
2. WHILE the CSV file is being parsed, THE RacingLineVisualizer SHALL show the current processing status
3. WHEN parsing completes successfully, THE RacingLineVisualizer SHALL hide the loading indicator
4. IF the CSV file fails to parse, THEN THE RacingLineVisualizer SHALL display an error message describing the failure
5. WHEN an error occurs, THE RacingLineVisualizer SHALL retain the previously loaded data

### Requirement 3

**User Story:** As a user, I want the file input to be clearly visible and accessible, so that I can easily load new lap data

#### Acceptance Criteria

1. THE RacingLineVisualizer SHALL position the file input control in a prominent location above the visualization
2. THE RacingLineVisualizer SHALL style the file input control to match the existing dark theme
3. THE RacingLineVisualizer SHALL display the currently loaded file name next to the file input
4. WHEN no file has been loaded through the input, THE RacingLineVisualizer SHALL display the default file name "lap_2.csv"
5. THE RacingLineVisualizer SHALL accept only files with .csv extension

### Requirement 4

**User Story:** As a developer, I want the CSV parsing logic to be reusable, so that I can load data from both URLs and local files

#### Acceptance Criteria

1. THE RacingLineVisualizer SHALL extract CSV parsing logic into a separate function
2. THE RacingLineVisualizer SHALL accept CSV data as a string or File object for parsing
3. WHEN parsing CSV data, THE RacingLineVisualizer SHALL group telemetry by timestamp
4. WHEN grouping telemetry, THE RacingLineVisualizer SHALL filter for rows with telemetry_name starting with "VBOX_"
5. THE RacingLineVisualizer SHALL return GPS points sorted by timestamp in ascending order
