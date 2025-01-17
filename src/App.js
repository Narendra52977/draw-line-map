import React, { useEffect, useState, useRef } from "react";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Draw } from "ol/interaction";
import { Style, Stroke } from "ol/style";
import { fromLonLat, toLonLat } from "ol/proj";
import Modal from "react-modal"; // You'll need to install this

const MapComponent = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [coordinates, setCoordinates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const modalStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      width: "500px",
      maxHeight: "80vh",
      overflow: "auto",
    },
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Create map instance
    const olMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 3,
      }),
    });

    // Create vector source and layer for drawing
    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({
          color: "red",
          width: 3,
        }),
      }),
    });
    olMap.addLayer(vectorLayer);

    setMap(olMap);

    // Cleanup
    return () => {
      if (olMap) {
        olMap.dispose();
      }
    };
  }, []);

  // Function to start drawing
  const startDrawing = () => {
    if (!map) return;

    // Remove any existing draw interactions
    map.getInteractions().forEach((interaction) => {
      if (interaction instanceof Draw) {
        map.removeInteraction(interaction);
      }
    });

    // Create draw interaction
    const drawLine = new Draw({
      source: map.getLayers().item(1).getSource(),
      type: "LineString",
    });

    // Add draw interaction to map
    map.addInteraction(drawLine);

    // Event listener for drawing
    drawLine.on("drawend", (event) => {
      const feature = event.feature;
      const lineGeometry = feature.getGeometry();

      // Convert coordinates to lon/lat
      const coords = lineGeometry.getCoordinates().map((coord) => {
        return toLonLat(coord);
      });

      setCoordinates(coords);

      // Remove draw interaction after drawing
      map.removeInteraction(drawLine);
    });
  };

  // Function to clear drawn lines
  const clearLines = () => {
    if (map) {
      const vectorLayer = map.getLayers().item(1);
      vectorLayer.getSource().clear();
      setCoordinates([]);
    }
  };

  // Open coordinate modal
  const openCoordinateModal = () => {
    setIsModalOpen(true);
  };

  // Close coordinate modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Format coordinate display
  const formatCoordinate = (coord) => {
    return {
      decimalDegrees: `Lon: ${coord[0].toFixed(6)}, Lat: ${coord[1].toFixed(
        6
      )}`,
      dms: convertToDMS(coord[0], true) + ", " + convertToDMS(coord[1], false),
    };
  };

  // Convert to Degrees, Minutes, Seconds
  const convertToDMS = (decimal, isLongitude) => {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesFloat = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = ((minutesFloat - minutes) * 60).toFixed(2);

    const direction =
      decimal >= 0 ? (isLongitude ? "E" : "N") : isLongitude ? "W" : "S";

    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  };

  return (
    <div>
      <div>Developed by Naveena</div>
      <div ref={mapRef} style={{ width: "100%", height: "500px" }} />
      <div>
        <button onClick={startDrawing}>Start Drawing</button>
        <button onClick={clearLines}>Clear Lines</button>
        <button
          onClick={openCoordinateModal}
          disabled={coordinates.length === 0}
        >
          Log Coordinates
        </button>
      </div>

      {/* Coordinate Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        style={modalStyles}
        contentLabel="Coordinate Details"
      >
        <h2>Coordinate Details</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Point</th>
              <th style={tableHeaderStyle}>Decimal Degrees</th>
              <th style={tableHeaderStyle}>DMS</th>
            </tr>
          </thead>
          <tbody>
            {coordinates.map((coord, index) => {
              const formattedCoord = formatCoordinate(coord);
              return (
                <tr key={index}>
                  <td style={tableCellStyle}>{index + 1}</td>
                  <td style={tableCellStyle}>
                    {formattedCoord.decimalDegrees}
                  </td>
                  <td style={tableCellStyle}>{formattedCoord.dms}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button onClick={closeModal}>Close</button>
        </div>
      </Modal>
    </div>
  );
};

// Styling for table
const tableHeaderStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  backgroundColor: "#f2f2f2",
};

const tableCellStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "center",
};

export default MapComponent;
