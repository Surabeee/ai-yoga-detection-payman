import React, { useRef, useEffect, useState } from "react";
import {
  FilesetResolver,
  PoseLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import PoseDisplay from "./PoseDisplay";
import NameInput from "./components/nameInput";
import { processReward } from "./services/paymanService";
import "./styles/RewardButton.css";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const imageCanvasRef = useRef(null);
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [referencePose, setReferencePose] = useState(null);
  const [isPoseMatched, setIsPoseMatched] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const drawingUtilsRef = useRef(null);
  const imageDrawingUtilsRef = useRef(null);

  // Timer state variables
  const [holdTime, setHoldTime] = useState(0);
  const [targetTime, setTargetTime] = useState(5);
  const [timerActive, setTimerActive] = useState(false);
  const [challengeComplete, setChallengeComplete] = useState(false);

  // Gamification state
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [sequence, setSequence] = useState([
    {
      id: 1,
      name: "Warrior Pose II",
      imagePath: "/image.png",
      completed: false,
      points: 100,
      difficultyMultiplier: 1.0,
    },
    {
      id: 2,
      name: "Upward Dog",
      imagePath: "/upward-dog.jpg",
      completed: false,
      points: 150,
      difficultyMultiplier: 1.2,
    },
    {
      id: 3,
      name: "Tree Pose",
      imagePath: "/tree-pose.jpg",
      completed: false,
      points: 200,
      difficultyMultiplier: 1.4,
    },
    {
      id: 4,
      name: "Downward Dog",
      imagePath: "/downward-dog.jpg",
      completed: false,
      points: 250,
      difficultyMultiplier: 1.6,
    },
  ]);

  // Payman integration state
  const [userName, setUserName] = useState("");
  const [showNameInput, setShowNameInput] = useState(true);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [anyPoseCompleted, setAnyPoseCompleted] = useState(false);

  // Load the MediaPipe model
  useEffect(() => {
    const loadModel = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
      });

      setPoseLandmarker(landmarker);
    };

    loadModel();
  }, []);

  // Start the webcam
  useEffect(() => {
    if (!userName) return;
    
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [userName]);

  // Initialize canvases
  useEffect(() => {
    if (canvasRef.current) {
      const videoCanvas = canvasRef.current;
      const ctx = videoCanvas.getContext("2d");
      drawingUtilsRef.current = new DrawingUtils(ctx);
    }

    if (imageCanvasRef.current) {
      const imageCanvas = imageCanvasRef.current;
      const ctx = imageCanvas.getContext("2d");
      imageDrawingUtilsRef.current = new DrawingUtils(ctx);
    }
  }, []);

  // Process reference image
  useEffect(() => {
    if (
      !poseLandmarker ||
      !imageRef.current ||
      !imageCanvasRef.current ||
      !imageDrawingUtilsRef.current
    )
      return;

    setChallengeComplete(false);
    setHoldTime(0);
    setTimerActive(false);
    setReferencePose(null);

    const analyzeReferenceImage = async () => {
      if (!imageRef.current.complete) {
        imageRef.current.onload = analyzeReferenceImage;
        return;
      }

      const imageWidth = imageRef.current.naturalWidth;
      const imageHeight = imageRef.current.naturalHeight;

      imageCanvasRef.current.width = imageWidth;
      imageCanvasRef.current.height = imageHeight;

      const ctx = imageCanvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, imageWidth, imageHeight);

      try {
        await poseLandmarker.setOptions({ runningMode: "IMAGE" });
        const results = await poseLandmarker.detect(imageRef.current);

        if (results.landmarks && results.landmarks.length > 0) {
          setReferencePose(results.landmarks[0]);

          imageDrawingUtilsRef.current.drawConnectors(
            results.landmarks[0],
            PoseLandmarker.POSE_CONNECTIONS,
            { color: "#00FF00", lineWidth: 2 }
          );
          imageDrawingUtilsRef.current.drawLandmarks(results.landmarks[0], {
            color: "#FF0000",
            radius: 3,
          });
        }

        await poseLandmarker.setOptions({ runningMode: "VIDEO" });
      } catch (error) {
        console.error("Error analyzing reference image:", error);
      }
    };

    analyzeReferenceImage();
  }, [poseLandmarker, currentPoseIndex]);

  // Timer effect
  useEffect(() => {
    let interval;

    if (isPoseMatched && !challengeComplete) {
      if (!timerActive) {
        setTimerActive(true);
        setHoldTime(0);
      }

      interval = setInterval(() => {
        setHoldTime((prevTime) => {
          const newTime = prevTime + 0.1;

          if (newTime >= targetTime && !challengeComplete) {
            const currentPose = sequence[currentPoseIndex];
            const pointsEarned = Math.round(
              currentPose.points *
                currentPose.difficultyMultiplier *
                (targetTime / 5)
            );

            setSequence((prev) => {
              const updated = [...prev];
              updated[currentPoseIndex] = {
                ...updated[currentPoseIndex],
                completed: true,
              };
              return updated;
            });

            setScore((prev) => prev + pointsEarned);
            setAnyPoseCompleted(true);

            setChallengeComplete(true);
            setAlertMessage(`Challenge Complete!<br>+${pointsEarned} Points`);
            setAlertType("");
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);

            clearInterval(interval);
          }

          return newTime;
        });
      }, 100);
    } else {
      if (timerActive && !challengeComplete) {
        setTimerActive(false);
        setHoldTime(0);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isPoseMatched,
    timerActive,
    challengeComplete,
    targetTime,
    sequence,
    currentPoseIndex,
  ]);

  // Process video frames
  useEffect(() => {
    if (
      !poseLandmarker ||
      !videoRef.current ||
      !canvasRef.current ||
      !referencePose ||
      !drawingUtilsRef.current
    )
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let animationId;
    const MATCH_THRESHOLD = 0.8;
    let lastVideoTime = -1;

    const detect = async () => {
      if (video.readyState < 2) {
        animationId = requestAnimationFrame(detect);
        return;
      }

      if (lastVideoTime === video.currentTime) {
        animationId = requestAnimationFrame(detect);
        return;
      }

      lastVideoTime = video.currentTime;

      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const results = await poseLandmarker.detectForVideo(
          video,
          performance.now()
        );

        if (results.landmarks && results.landmarks.length > 0) {
          drawingUtilsRef.current.drawConnectors(
            results.landmarks[0],
            PoseLandmarker.POSE_CONNECTIONS,
            { color: "#00FF00", lineWidth: 2 }
          );
          drawingUtilsRef.current.drawLandmarks(results.landmarks[0], {
            color: "#FF0000",
            radius: 3,
          });

          const similarity = comparePoses(results.landmarks[0], referencePose);
          const currentMatch = similarity > MATCH_THRESHOLD;

          setIsPoseMatched(currentMatch);
        }
      } catch (error) {
        console.error("Error in pose detection:", error);
      }

      animationId = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [poseLandmarker, referencePose]);

  // Utility functions
  function getAngle(A, B, C) {
    const AB = { x: A.x - B.x, y: A.y - B.y };
    const CB = { x: C.x - B.x, y: C.y - B.y };
    const dot = AB.x * CB.x + AB.y * CB.y;
    const magAB = Math.hypot(AB.x, AB.y);
    const magCB = Math.hypot(CB.x, CB.y);
    if (magAB === 0 || magCB === 0) return 0;
    const cosAngle = dot / (magAB * magCB);
    const angle = Math.acos(Math.min(1, Math.max(-1, cosAngle)));
    return (angle * 180) / Math.PI;
  }

  function normalizePose(landmarks) {
    const lh = landmarks[23];
    const rh = landmarks[24];
    const ls = landmarks[11];
    const rs = landmarks[12];

    const center = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
    const shoulderMid = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
    const torsoLen =
      Math.hypot(shoulderMid.x - center.x, shoulderMid.y - center.y) || 1;

    return landmarks.map((pt) => ({
      x: (pt.x - center.x) / torsoLen,
      y: (pt.y - center.y) / torsoLen,
      z: pt.z != null ? pt.z / torsoLen : 0,
    }));
  }

  function comparePoses(pose1, pose2) {
    if (!pose1 || !pose2) return 0;
    const P1 = normalizePose(pose1);
    const P2 = normalizePose(pose2);

    const joints = [
      [11, 13, 15], [12, 14, 16], [13, 11, 23], [14, 12, 24],
      [23, 25, 27], [24, 26, 28], [25, 23, 11], [26, 24, 12],
    ];

    let totalDiff = 0;
    joints.forEach(([a, b, c]) => {
      const angle1 = getAngle(P1[a], P1[b], P1[c]);
      const angle2 = getAngle(P2[a], P2[b], P2[c]);
      totalDiff += Math.abs(angle1 - angle2);
    });

    const avgDiff = totalDiff / joints.length;
    const maxTolerance = 45;
    const similarity = Math.max(0, 1 - avgDiff / maxTolerance);
    return similarity;
  }

  // Event handlers
  const handleNameSubmit = (name) => {
    setUserName(name);
    setShowNameInput(false);
  };

  const handleClaimReward = async () => {
    if (isClaimingReward || rewardClaimed || !anyPoseCompleted) {
      return;
    }
    
    setIsClaimingReward(true);
    
    try {
      const result = await processReward(userName, 30);
      
      if (result.success) {
        setRewardClaimed(true);
        setAlertMessage(`Congratulations ${userName}!<br>You've earned 30 TSD for completing the yoga challenge!`);
        setAlertType("reward-success");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
      } else {
        setAlertMessage(`Failed to process reward: ${result.message}`);
        setAlertType("");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    } catch (error) {
      setAlertMessage(`Error: ${error.message}`);
      setAlertType("");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } finally {
      setIsClaimingReward(false);
    }
  };

  const resetChallenge = () => {
    setScore(0);
    setSequence((prev) =>
      prev.map((pose) => ({
        ...pose,
        completed: false,
      }))
    );
    setChallengeComplete(false);
    setHoldTime(0);
    setTimerActive(false);
    setAnyPoseCompleted(false);
  };

  const handleTargetTimeChange = (e) => {
    setTargetTime(parseInt(e.target.value, 10));
    resetChallenge();
  };

  const moveToNextPose = () => {
    setChallengeComplete(false);
    setHoldTime(0);
    setTimerActive(false);

    if (currentPoseIndex < sequence.length - 1) {
      setCurrentPoseIndex(currentPoseIndex + 1);
    } else {
      const newLevel = level + 1;
      setLevel(newLevel);

      setSequence((prev) =>
        prev.map((pose) => ({
          ...pose,
          completed: false,
          difficultyMultiplier: pose.difficultyMultiplier * 1.2,
        }))
      );

      setCurrentPoseIndex(0);

      setAlertMessage(`Level ${level} Complete! All poses mastered!`);
      setAlertType("");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  const goToPose = (index) => {
    if (index < sequence.length) {
      setCurrentPoseIndex(index);
      setChallengeComplete(false);
      setHoldTime(0);
      setTimerActive(false);
    }
  };

  return (
    <>
      {showNameInput && <NameInput onSubmit={handleNameSubmit} />}
      
      <PoseDisplay
        userName={userName}
        level={level}
        score={score}
        currentPoseIndex={currentPoseIndex}
        sequence={sequence}
        targetTime={targetTime}
        holdTime={holdTime}
        challengeComplete={challengeComplete}
        isPoseMatched={isPoseMatched}
        showAlert={showAlert}
        alertMessage={alertMessage}
        alertType={alertType}
        videoRef={videoRef}
        canvasRef={canvasRef}
        imageRef={imageRef}
        imageCanvasRef={imageCanvasRef}
        handleTargetTimeChange={handleTargetTimeChange}
        resetChallenge={resetChallenge}
        moveToNextPose={moveToNextPose}
        goToPose={goToPose}
        isClaimingReward={isClaimingReward}
        rewardClaimed={rewardClaimed}
        handleClaimReward={handleClaimReward}
        anyPoseCompleted={anyPoseCompleted}
      />
    </>
  );
}

export default App;