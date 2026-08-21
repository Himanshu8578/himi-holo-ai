/*
==============================================================
 HIMI HOLO AI
 HOLOGRAPHIC AVATAR ENGINE
 avatar.js
 FINAL COMPLETE VERSION
==============================================================

 FILE:
 frontend/3D/avatar.js

 DEPENDENCY:
 Three.js must already be loaded by index.html.

 PUBLIC API:
   new HimiAvatar(canvas)
   setState(state)
   setEmotion(emotion)
   setGesture(gesture, intensity)
   setIntensity(value)
   setConfidence(value)
   setVoiceLevel(value)
   setSpeaking(value)
   resetGesture()

 STATES:
   idle
   thinking
   listening
   speaking
   warning

 EMOTIONS:
   neutral
   happy
   thinking
   serious
   surprised
   excited
   warning

 GESTURES:
   idle
   think
   explain
   open
   alert

==============================================================
*/

"use strict";


// ============================================================
// THREE CHECK
// ============================================================

if (typeof THREE === "undefined") {

    console.error(
        "HIMI AVATAR ERROR: Three.js is not loaded."
    );

}


// ============================================================
// UTILITY
// ============================================================

function clamp(
    value,
    min,
    max,
    fallback = min
) {

    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {

        return fallback;

    }

    return Math.max(
        min,
        Math.min(
            max,
            number
        )
    );

}


// ============================================================
// HIMI AVATAR
// ============================================================

class HimiAvatar {

    constructor(canvas) {

        if (
            typeof THREE === "undefined"
        ) {

            throw new Error(
                "Three.js is required."
            );

        }


        if (
            !canvas
        ) {

            throw new Error(
                "HimiAvatar requires a canvas."
            );

        }


        this.canvas =
            canvas;


        // ====================================================
        // STATE
        // ====================================================

        this.state =
            "idle";

        this.emotion =
            "neutral";

        this.gesture =
            "idle";

        this.intensity =
            0.5;

        this.confidence =
            0.85;

        this.voiceLevel =
            0;

        this.speaking =
            false;

        this.time =
            0;

        this.mouseX =
            0;

        this.mouseY =
            0;

        this.targetMouseX =
            0;

        this.targetMouseY =
            0;


        // ====================================================
        // GESTURE STATE
        // ====================================================

        this.gestureStart =
            performance.now();

        this.gestureDuration =
            1.4;


        // ====================================================
        // CLOCK
        // ====================================================

        this.clock =
            new THREE.Clock();


        // ====================================================
        // SCENE
        // ====================================================

        this.scene =
            new THREE.Scene();


        // ====================================================
        // CAMERA
        // ====================================================

        this.camera =
            new THREE.PerspectiveCamera(
                38,
                1,
                0.1,
                100
            );


        this.camera.position.set(
            0,
            1.25,
            5.7
        );


        this.camera.lookAt(
            0,
            1.15,
            0
        );


        // ====================================================
        // RENDERER
        // ====================================================

        this.renderer =
            new THREE.WebGLRenderer({

                canvas:
                    this.canvas,

                antialias:
                    true,

                alpha:
                    true,

                powerPreference:
                    "high-performance"

            });


        this.renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio || 1,
                2
            )
        );


        this.renderer.outputColorSpace =
            THREE.SRGBColorSpace;


        this.renderer.toneMapping =
            THREE.ACESFilmicToneMapping;


        this.renderer.toneMappingExposure =
            1.15;


        // ====================================================
        // LIGHTS
        // ====================================================

        this.createLights();


        // ====================================================
        // MAIN AVATAR GROUP
        // ====================================================

        this.avatar =
            new THREE.Group();


        this.avatar.position.y =
            -1.25;


        this.scene.add(
            this.avatar
        );


        // ====================================================
        // CREATE EVERYTHING
        // ====================================================

        this.createBody();

        this.createHead();

        this.createFace();

        this.createEyes();

        this.createNeck();

        this.createShoulders();

        this.createArms();

        this.createChestCore();

        this.createHologramRings();

        this.createParticles();

        this.createEnergyField();

        this.createGround();

        this.createScanSystem();


        // ====================================================
        // EVENTS
        // ====================================================

        this.setupEvents();


        // ====================================================
        // INITIAL RESIZE
        // ====================================================

        this.resize();


        // ====================================================
        // INITIAL COLORS
        // ====================================================

        this.applyEmotionColor();


        // ====================================================
        // START
        // ====================================================

        this.animate();


        console.log(
            "HIMI HOLOGRAPHIC AVATAR ONLINE"
        );

    }


    // ========================================================
    // MATERIAL
    // ========================================================

    createMaterial(
        color = 0x00eaff,
        opacity = 0.4,
        wireframe = false
    ) {

        return new THREE.MeshBasicMaterial({

            color,

            transparent:
                true,

            opacity,

            wireframe,

            blending:
                THREE.AdditiveBlending,

            depthWrite:
                false,

            side:
                THREE.DoubleSide

        });

    }


    // ========================================================
    // LIGHTS
    // ========================================================

    createLights() {

        const ambient =
            new THREE.AmbientLight(
                0x003b4d,
                1.4
            );


        this.scene.add(
            ambient
        );


        this.mainLight =
            new THREE.PointLight(
                0x00eaff,
                8,
                12
            );


        this.mainLight.position.set(
            0,
            2.4,
            2.5
        );


        this.scene.add(
            this.mainLight
        );


        this.sideLight =
            new THREE.PointLight(
                0x0088ff,
                5,
                10
            );


        this.sideLight.position.set(
            -3,
            1.5,
            1
        );


        this.scene.add(
            this.sideLight
        );

    }


    // ========================================================
    // BODY
    // ========================================================

    createBody() {

        this.body =
            new THREE.Group();


        this.avatar.add(
            this.body
        );


        // ----------------------------------------------------
        // OUTER TORSO
        // ----------------------------------------------------

        const torsoGeometry =
            new THREE.CylinderGeometry(
                0.72,
                0.92,
                1.65,
                20,
                8,
                true
            );


        this.torso =
            new THREE.Mesh(

                torsoGeometry,

                this.createMaterial(
                    0x00eaff,
                    0.28,
                    true
                )

            );


        this.torso.position.y =
            0.72;


        this.body.add(
            this.torso
        );


        // ----------------------------------------------------
        // INNER TORSO
        // ----------------------------------------------------

        const innerGeometry =
            new THREE.CylinderGeometry(
                0.58,
                0.76,
                1.55,
                18,
                6,
                true
            );


        this.innerTorso =
            new THREE.Mesh(

                innerGeometry,

                this.createMaterial(
                    0x00eaff,
                    0.055,
                    false
                )

            );


        this.innerTorso.position.y =
            0.72;


        this.body.add(
            this.innerTorso
        );


        // ----------------------------------------------------
        // LOWER ENERGY SHELL
        // ----------------------------------------------------

        const lowerGeometry =
            new THREE.CylinderGeometry(
                0.96,
                0.54,
                0.65,
                18,
                5,
                true
            );


        this.lowerShell =
            new THREE.Mesh(

                lowerGeometry,

                this.createMaterial(
                    0x00eaff,
                    0.12,
                    true
                )

            );


        this.lowerShell.position.y =
            -0.18;


        this.body.add(
            this.lowerShell
        );

    }


    // ========================================================
    // NECK
    // ========================================================

    createNeck() {

        const geometry =
            new THREE.CylinderGeometry(
                0.25,
                0.34,
                0.45,
                14,
                5,
                true
            );


        this.neck =
            new THREE.Mesh(

                geometry,

                this.createMaterial(
                    0x00eaff,
                    0.26,
                    true
                )

            );


        this.neck.position.y =
            1.55;


        this.avatar.add(
            this.neck
        );

    }


    // ========================================================
    // HEAD
    // ========================================================

    createHead() {

        this.head =
            new THREE.Group();


        this.head.position.y =
            2.25;


        this.avatar.add(
            this.head
        );


        // ----------------------------------------------------
        // HEAD SHELL
        // ----------------------------------------------------

        const geometry =
            new THREE.SphereGeometry(
                0.72,
                28,
                20
            );


        this.headShell =
            new THREE.Mesh(

                geometry,

                this.createMaterial(
                    0x00eaff,
                    0.27,
                    true
                )

            );


        this.headShell.scale.set(
            0.83,
            1.05,
            0.78
        );


        this.head.add(
            this.headShell
        );


        // ----------------------------------------------------
        // INNER HEAD
        // ----------------------------------------------------

        const innerGeometry =
            new THREE.SphereGeometry(
                0.65,
                20,
                16
            );


        this.innerHead =
            new THREE.Mesh(

                innerGeometry,

                this.createMaterial(
                    0x00eaff,
                    0.055,
                    false
                )

            );


        this.innerHead.scale.set(
            0.83,
            1.05,
            0.78
        );


        this.head.add(
            this.innerHead
        );


        // ----------------------------------------------------
        // HEAD CROWN
        // ----------------------------------------------------

        const crownGeometry =
            new THREE.TorusGeometry(
                0.53,
                0.012,
                8,
                64
            );


        this.crown =
            new THREE.Mesh(

                crownGeometry,

                this.createMaterial(
                    0x00eaff,
                    0.5,
                    false
                )

            );


        this.crown.rotation.x =
            Math.PI / 2;


        this.crown.position.y =
            0.56;


        this.head.add(
            this.crown
        );

    }


    // ========================================================
    // FACE
    // ========================================================

    createFace() {

        this.face =
            new THREE.Group();


        this.face.position.z =
            0.61;


        this.face.position.y =
            2.25;


        this.avatar.add(
            this.face
        );


        // ----------------------------------------------------
        // FACE FRAME
        // ----------------------------------------------------

        const frameGeometry =
            new THREE.RingGeometry(
                0.38,
                0.395,
                48
            );


        this.faceFrame =
            new THREE.Mesh(

                frameGeometry,

                this.createMaterial(
                    0x00eaff,
                    0.2,
                    false
                )

            );


        this.face.add(
            this.faceFrame
        );


        // ----------------------------------------------------
        // NOSE
        // ----------------------------------------------------

        const noseGeometry =
            new THREE.BufferGeometry();


        const noseVertices =
            new Float32Array([

                0,
                0.10,
                0,

                0,
                -0.08,
                0,

                0.07,
                -0.02,
                0

            ]);


        noseGeometry.setAttribute(

            "position",

            new THREE.BufferAttribute(
                noseVertices,
                3
            )

        );


        this.nose =
            new THREE.Line(

                noseGeometry,

                new THREE.LineBasicMaterial({

                    color:
                        0x00eaff,

                    transparent:
                        true,

                    opacity:
                        0.35,

                    blending:
                        THREE.AdditiveBlending

                })

            );


        this.face.add(
            this.nose
        );


        // ----------------------------------------------------
        // MOUTH
        // ----------------------------------------------------

        const mouthCurve =
            new THREE.EllipseCurve(

                0,
                -0.18,

                0.20,
                0.055,

                Math.PI,
                Math.PI * 2,

                false,
                0

            );


        const points =
            mouthCurve.getPoints(
                30
            );


        const mouthGeometry =
            new THREE.BufferGeometry()
                .setFromPoints(
                    points
                );


        this.mouth =
            new THREE.Line(

                mouthGeometry,

                new THREE.LineBasicMaterial({

                    color:
                        0x00eaff,

                    transparent:
                        true,

                    opacity:
                        0.85,

                    blending:
                        THREE.AdditiveBlending

                })

            );


        this.face.add(
            this.mouth
        );

    }


    // ========================================================
    // EYES
    // ========================================================

    createEyes() {

        this.eyeGroup =
            new THREE.Group();


        this.eyeGroup.position.y =
            2.34;


        this.eyeGroup.position.z =
            0.64;


        this.avatar.add(
            this.eyeGroup
        );


        const eyeGeometry =
            new THREE.SphereGeometry(
                0.105,
                16,
                10
            );


        this.leftEye =
            new THREE.Mesh(

                eyeGeometry,

                this.createMaterial(
                    0xcfffff,
                    0.95,
                    false
                )

            );


        this.rightEye =
            new THREE.Mesh(

                eyeGeometry.clone(),

                this.createMaterial(
                    0xcfffff,
                    0.95,
                    false
                )

            );


        this.leftEye.position.x =
            -0.245;


        this.rightEye.position.x =
            0.245;


        this.eyeGroup.add(
            this.leftEye
        );


        this.eyeGroup.add(
            this.rightEye
        );


        // ----------------------------------------------------
        // EYE RINGS
        // ----------------------------------------------------

        const ringGeometry =
            new THREE.RingGeometry(
                0.125,
                0.145,
                32
            );


        this.leftEyeRing =
            new THREE.Mesh(

                ringGeometry,

                this.createMaterial(
                    0x00eaff,
                    0.4,
                    false
                )

            );


        this.rightEyeRing =
            new THREE.Mesh(

                ringGeometry.clone(),

                this.createMaterial(
                    0x00eaff,
                    0.4,
                    false
                )

            );


        this.leftEyeRing.position.x =
            -0.245;


        this.rightEyeRing.position.x =
            0.245;


        this.eyeGroup.add(
            this.leftEyeRing
        );


        this.eyeGroup.add(
            this.rightEyeRing
        );

    }


    // ========================================================
    // SHOULDERS
    // ========================================================

    createShoulders() {

        this.shoulders =
            new THREE.Group();


        this.shoulders.position.y =
            1.32;


        this.avatar.add(
            this.shoulders
        );


        const geometry =
            new THREE.SphereGeometry(
                0.37,
                18,
                12
            );


        this.leftShoulder =
            new THREE.Mesh(

                geometry,

                this.createMaterial(
                    0x00eaff,
                    0.25,
                    true
                )

            );


        this.rightShoulder =
            new THREE.Mesh(

                geometry.clone(),

                this.createMaterial(
                    0x00eaff,
                    0.25,
                    true
                )

            );


        this.leftShoulder.position.x =
            -0.78;


        this.rightShoulder.position.x =
            0.78;


        this.shoulders.add(
            this.leftShoulder
        );


        this.shoulders.add(
            this.rightShoulder
        );

    }


    // ========================================================
    // ARMS
    // ========================================================

    createArms() {

        this.arms =
            new THREE.Group();


        this.avatar.add(
            this.arms
        );


        this.leftArm =
            this.createArm(
                -1
            );


        this.rightArm =
            this.createArm(
                1
            );


        this.arms.add(
            this.leftArm
        );


        this.arms.add(
            this.rightArm
        );

    }


    createArm(side) {

        const arm =
            new THREE.Group();


        arm.position.set(
            side * 0.84,
            1.12,
            0
        );


        arm.rotation.z =
            side * -0.08;


        // ----------------------------------------------------
        // UPPER ARM
        // ----------------------------------------------------

        const upperGeometry =
            new THREE.CylinderGeometry(
                0.11,
                0.15,
                0.72,
                12,
                5
            );


        const upper =
            new THREE.Mesh(

                upperGeometry,

                this.createMaterial(
                    0x00eaff,
                    0.3,
                    true
                )

            );


        upper.rotation.z =
            side * 0.12;


        arm.add(
            upper
        );


        // ----------------------------------------------------
        // FOREARM
        // ----------------------------------------------------

        const lowerGeometry =
            new THREE.CylinderGeometry(
                0.085,
                0.12,
                0.68,
                12,
                5
            );


        const lower =
            new THREE.Mesh(

                lowerGeometry,

                this.createMaterial(
                    0x00eaff,
                    0.25,
                    true
                )

            );


        lower.position.y =
            -0.55;


        lower.rotation.z =
            side * -0.08;


        arm.add(
            lower
        );


        // ----------------------------------------------------
        // HAND
        // ----------------------------------------------------

        const handGeometry =
            new THREE.SphereGeometry(
                0.14,
                12,
                9
            );


        const hand =
            new THREE.Mesh(

                handGeometry,

                this.createMaterial(
                    0x00eaff,
                    0.26,
                    true
                )

            );


        hand.position.y =
            -0.98;


        arm.add(
            hand
        );


        return arm;

    }


    // ========================================================
    // CHEST CORE
    // ========================================================

    createChestCore() {

        this.coreGroup =
            new THREE.Group();


        this.coreGroup.position.set(
            0,
            0.78,
            0.72
        );


        this.avatar.add(
            this.coreGroup
        );


        // ----------------------------------------------------
        // CORE
        // ----------------------------------------------------

        const geometry =
            new THREE.IcosahedronGeometry(
                0.24,
                2
            );


        this.core =
            new THREE.Mesh(

                geometry,

                this.createMaterial(
                    0x00ffff,
                    0.85,
                    true
                )

            );


        this.coreGroup.add(
            this.core
        );


        // ----------------------------------------------------
        // CORE GLOW
        // ----------------------------------------------------

        const glowGeometry =
            new THREE.SphereGeometry(
                0.37,
                20,
                20
            );


        this.coreGlow =
            new THREE.Mesh(

                glowGeometry,

                this.createMaterial(
                    0x00eaff,
                    0.08,
                    false
                )

            );


        this.coreGroup.add(
            this.coreGlow
        );


        // ----------------------------------------------------
        // CORE RINGS
        // ----------------------------------------------------

        this.coreRings =
            [];


        for (
            let i = 0;
            i < 4;
            i++
        ) {

            const ringGeometry =
                new THREE.TorusGeometry(
                    0.33 +
                    i * 0.085,
                    0.007,
                    8,
                    72
                );


            const ring =
                new THREE.Mesh(

                    ringGeometry,

                    this.createMaterial(
                        0x00eaff,
                        0.45 -
                        i * 0.07,
                        false
                    )

                );


            ring.rotation.x =
                Math.PI / 2;


            ring.rotation.z =
                i * 0.6;


            this.coreGroup.add(
                ring
            );


            this.coreRings.push(
                ring
            );

        }

    }


    // ========================================================
    // HOLOGRAM RINGS
    // ========================================================

    createHologramRings() {

        this.rings =
            [];


        const configs = [

            {
                radius:
                    1.15,

                y:
                    0.02,

                opacity:
                    0.42,

                speed:
                    0.4

            },

            {
                radius:
                    1.48,

                y:
                    0.48,

                opacity:
                    0.3,

                speed:
                    -0.28

            },

            {
                radius:
                    1.78,

                y:
                    1.1,

                opacity:
                    0.2,

                speed:
                    0.18

            },

            {
                radius:
                    2.05,

                y:
                    1.8,

                opacity:
                    0.13,

                speed:
                    -0.12

            }

        ];


        configs.forEach(
            config => {

                const geometry =
                    new THREE.TorusGeometry(
                        config.radius,
                        0.007,
                        8,
                        96
                    );


                const ring =
                    new THREE.Mesh(

                        geometry,

                        this.createMaterial(
                            0x00eaff,
                            config.opacity,
                            false
                        )

                    );


                ring.position.y =
                    config.y;


                ring.userData.speed =
                    config.speed;


                this.avatar.add(
                    ring
                );


                this.rings.push(
                    ring
                );

            }
        );

    }


    // ========================================================
    // PARTICLES
    // ========================================================

    createParticles() {

        const count =
            1100;


        const positions =
            new Float32Array(
                count * 3
            );


        this.particleData =
            [];


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const angle =
                Math.random() *
                Math.PI *
                2;


            const radius =
                1.0 +
                Math.random() *
                2.3;


            const y =
                -0.7 +
                Math.random() *
                3.8;


            positions[
                i * 3
            ] =
                Math.cos(
                    angle
                ) *
                radius;


            positions[
                i * 3 + 1
            ] =
                y;


            positions[
                i * 3 + 2
            ] =
                Math.sin(
                    angle
                ) *
                radius;


            this.particleData.push({

                angle,

                radius,

                y,

                speed:
                    0.03 +
                    Math.random() *
                    0.16,

                phase:
                    Math.random() *
                    Math.PI *
                    2

            });

        }


        const geometry =
            new THREE.BufferGeometry();


        geometry.setAttribute(

            "position",

            new THREE.BufferAttribute(
                positions,
                3
            )

        );


        const material =
            new THREE.PointsMaterial({

                color:
                    0x00eaff,

                size:
                    0.025,

                transparent:
                    true,

                opacity:
                    0.65,

                blending:
                    THREE.AdditiveBlending,

                depthWrite:
                    false

            });


        this.particles =
            new THREE.Points(
                geometry,
                material
            );


        this.avatar.add(
            this.particles
        );

    }


    // ========================================================
    // ENERGY FIELD
    // ========================================================

    createEnergyField() {

        this.energyLines =
            [];


        for (
            let i = 0;
            i < 22;
            i++
        ) {

            const points =
                [];


            const radius =
                0.8 +
                Math.random() *
                1.7;


            const y =
                -0.7 +
                Math.random() *
                3.4;


            for (
                let j = 0;
                j < 14;
                j++
            ) {

                const angle =
                    (
                        j / 13
                    ) *
                    Math.PI *
                    2;


                points.push(

                    new THREE.Vector3(

                        Math.cos(
                            angle
                        ) *
                        radius,

                        y +
                        Math.sin(
                            angle * 3
                        ) *
                        0.035,

                        Math.sin(
                            angle
                        ) *
                        radius

                    )

                );

            }


            const geometry =
                new THREE.BufferGeometry()
                    .setFromPoints(
                        points
                    );


            const line =
                new THREE.Line(

                    geometry,

                    new THREE.LineBasicMaterial({

                        color:
                            0x00eaff,

                        transparent:
                            true,

                        opacity:
                            0.06,

                        blending:
                            THREE.AdditiveBlending

                    })

                );


            line.userData.speed =
                0.08 +
                Math.random() *
                0.25;


            this.avatar.add(
                line
            );


            this.energyLines.push(
                line
            );

        }

    }


    // ========================================================
    // GROUND
    // ========================================================

    createGround() {

        const geometry =
            new THREE.CircleGeometry(
                3.4,
                96
            );


        const material =
            this.createMaterial(
                0x00eaff,
                0.035,
                true
            );


        this.ground =
            new THREE.Mesh(
                geometry,
                material
            );


        this.ground.rotation.x =
            -Math.PI / 2;


        this.ground.position.y =
            -1.25;


        this.scene.add(
            this.ground
        );


        // ----------------------------------------------------
        // GROUND RINGS
        // ----------------------------------------------------

        this.groundRings =
            [];


        for (
            let i = 0;
            i < 4;
            i++
        ) {

            const ringGeometry =
                new THREE.RingGeometry(
                    0.7 +
                    i * 0.45,

                    0.705 +
                    i * 0.45,

                    96
                );


            const ring =
                new THREE.Mesh(

                    ringGeometry,

                    this.createMaterial(
                        0x00eaff,
                        0.14 -
                        i * 0.025,
                        false
                    )

                );


            ring.rotation.x =
                -Math.PI / 2;


            ring.position.y =
                -1.24;


            this.scene.add(
                ring
            );


            this.groundRings.push(
                ring
            );

        }

    }


    // ========================================================
    // SCAN SYSTEM
    // ========================================================

    createScanSystem() {

        this.scanGroup =
            new THREE.Group();


        this.avatar.add(
            this.scanGroup
        );


        for (
            let i = 0;
            i < 4;
            i++
        ) {

            const geometry =
                new THREE.RingGeometry(
                    0.7 +
                    i * 0.28,

                    0.705 +
                    i * 0.28,

                    64
                );


            const scan =
                new THREE.Mesh(

                    geometry,

                    this.createMaterial(
                        0x00eaff,
                        0.11 -
                        i * 0.02,
                        false
                    )

                );


            scan.position.y =
                -0.1 +
                i * 0.7;


            scan.rotation.x =
                Math.PI / 2;


            this.scanGroup.add(
                scan
            );

        }

    }


    // ========================================================
    // EVENTS
    // ========================================================

    setupEvents() {

        window.addEventListener(
            "resize",
            () => this.resize()
        );


        window.addEventListener(
            "mousemove",
            event => {

                this.targetMouseX =
                    (
                        event.clientX /
                        window.innerWidth
                    ) *
                    2 -
                    1;


                this.targetMouseY =
                    (
                        event.clientY /
                        window.innerHeight
                    ) *
                    2 -
                    1;

            }
        );


        this.canvas.addEventListener(
            "click",
            () => {

                this.setGesture(
                    "open",
                    0.65
                );

            }
        );

    }


    // ========================================================
    // RESIZE
    // ========================================================

    resize() {

        const parent =
            this.canvas.parentElement;


        const width =
            parent?.clientWidth ||
            this.canvas.clientWidth ||
            800;


        const height =
            parent?.clientHeight ||
            this.canvas.clientHeight ||
            600;


        if (
            width <= 0 ||
            height <= 0
        ) {

            return;

        }


        this.camera.aspect =
            width / height;


        this.camera.updateProjectionMatrix();


        this.renderer.setSize(
            width,
            height,
            false
        );

    }


    // ========================================================
    // PUBLIC: STATE
    // ========================================================

    setState(state) {

        const value =
            String(
                state ||
                "idle"
            ).toLowerCase();


        if (
            value.includes(
                "think"
            ) ||
            value.includes(
                "process"
            )
        ) {

            this.state =
                "thinking";

        }
        else if (
            value.includes(
                "listen"
            )
        ) {

            this.state =
                "listening";

        }
        else if (
            value.includes(
                "speak"
            ) ||
            value.includes(
                "respond"
            ) ||
            value.includes(
                "output"
            )
        ) {

            this.state =
                "speaking";

        }
        else if (
            value.includes(
                "warn"
            ) ||
            value.includes(
                "error"
            )
        ) {

            this.state =
                "warning";

        }
        else {

            this.state =
                "idle";

        }

    }


    // ========================================================
    // PUBLIC: EMOTION
    // ========================================================

    setEmotion(emotion) {

        const allowed = [

            "neutral",
            "happy",
            "thinking",
            "serious",
            "surprised",
            "excited",
            "warning"

        ];


        const value =
            String(
                emotion ||
                "neutral"
            ).toLowerCase();


        this.emotion =
            allowed.includes(
                value
            )
                ? value
                : "neutral";


        this.applyEmotionColor();

    }


    // ========================================================
    // PUBLIC: GESTURE
    // ========================================================

    setGesture(
        gesture,
        intensity = 0.5
    ) {

        this.gesture =
            String(
                gesture ||
                "idle"
            ).toLowerCase();


        this.intensity =
            clamp(
                intensity,
                0,
                1,
                0.5
            );


        this.gestureStart =
            performance.now();

    }


    // ========================================================
    // PUBLIC: INTENSITY
    // ========================================================

    setIntensity(value) {

        this.intensity =
            clamp(
                value,
                0,
                1,
                0.5
            );

    }


    // ========================================================
    // PUBLIC: CONFIDENCE
    // ========================================================

    setConfidence(value) {

        this.confidence =
            clamp(
                value,
                0,
                1,
                0.85
            );

    }


    // ========================================================
    // PUBLIC: VOICE LEVEL
    // ========================================================

    setVoiceLevel(value) {

        this.voiceLevel =
            clamp(
                value,
                0,
                1,
                0
            );

    }


    // ========================================================
    // PUBLIC: SPEAKING
    // ========================================================

    setSpeaking(value) {

        this.speaking =
            Boolean(
                value
            );


        if (
            this.speaking
        ) {

            this.state =
                "speaking";

        }
        else if (
            this.state ===
            "speaking"
        ) {

            this.state =
                "idle";

        }

    }


    // ========================================================
    // PUBLIC: RESET GESTURE
    // ========================================================

    resetGesture() {

        this.gesture =
            "idle";

        this.intensity =
            0.5;

    }


    // ========================================================
    // EMOTION COLORS
    // ========================================================

    applyEmotionColor() {

        let color =
            0x00eaff;


        switch (
            this.emotion
        ) {

            case "happy":

                color =
                    0x00ffc8;

                break;


            case "thinking":

                color =
                    0x4488ff;

                break;


            case "serious":

                color =
                    0x00aaff;

                break;


            case "surprised":

                color =
                    0x66ffff;

                break;


            case "excited":

                color =
                    0x00ffff;

                break;


            case "warning":

                color =
                    0xff5577;

                break;


            default:

                color =
                    0x00eaff;

        }


        this.setObjectColor(
            this.avatar,
            color
        );


        if (
            this.mainLight
        ) {

            this.mainLight.color.setHex(
                color
            );

        }

    }


    // ========================================================
    // SET OBJECT COLOR
    // ========================================================

    setObjectColor(
        object,
        color
    ) {

        object.traverse(
            child => {

                if (
                    !child.material
                ) {

                    return;

                }


                const materials =
                    Array.isArray(
                        child.material
                    )
                        ? child.material
                        : [
                            child.material
                        ];


                materials.forEach(
                    material => {

                        if (
                            material.color
                        ) {

                            material.color.setHex(
                                color
                            );

                        }

                    }
                );

            }
        );

    }


    // ========================================================
    // BODY UPDATE
    // ========================================================

    updateBody(delta) {

        // ----------------------------------------------------
        // FLOATING
        // ----------------------------------------------------

        this.avatar.position.y =
            -1.25 +
            Math.sin(
                this.time * 0.8
            ) *
            0.055;


        // ----------------------------------------------------
        // BREATHING
        // ----------------------------------------------------

        const breathing =
            1 +
            Math.sin(
                this.time * 1.7
            ) *
            0.018;


        const speechScale =
            1 +
            this.voiceLevel *
            0.11;


        const finalScale =
            breathing *
            speechScale;


        this.avatar.scale.setScalar(
            finalScale
        );


        // ----------------------------------------------------
        // MOUSE TRACKING
        // ----------------------------------------------------

        this.mouseX +=
            (
                this.targetMouseX -
                this.mouseX
            ) *
            delta *
            3;


        this.mouseY +=
            (
                this.targetMouseY -
                this.mouseY
            ) *
            delta *
            3;


        this.avatar.rotation.y =
            this.mouseX *
            0.11;


        this.avatar.rotation.x =
            this.mouseY *
            0.035;


        // ----------------------------------------------------
        // HEAD MOVEMENT
        // ----------------------------------------------------

        this.head.rotation.y =
            Math.sin(
                this.time * 0.42
            ) *
            0.025;


        this.head.rotation.z =
            Math.sin(
                this.time * 0.33
            ) *
            0.018;


        // ----------------------------------------------------
        // CORE
        // ----------------------------------------------------

        this.core.rotation.x +=
            delta *
            (
                0.7 +
                this.intensity
            );


        this.core.rotation.y +=
            delta *
            1.15;


        const corePulse =
            1 +
            Math.sin(
                this.time * 4
            ) *
            0.08 +
            this.voiceLevel *
            0.3;


        this.core.scale.setScalar(
            corePulse
        );


        this.coreGlow.scale.setScalar(
            1 +
            this.voiceLevel *
            0.6
        );


        // ----------------------------------------------------
        // CORE RINGS
        // ----------------------------------------------------

        this.coreRings.forEach(
            (
                ring,
                index
            ) => {

                ring.rotation.z +=
                    delta *
                    (
                        0.25 +
                        index *
                        0.13
                    );

            }
        );

    }


    // ========================================================
    // EYES
    // ========================================================

    updateEyes() {

        // ----------------------------------------------------
        // NATURAL BLINK
        // ----------------------------------------------------

        const blinkWave =
            Math.sin(
                this.time * 0.7
            );


        let eyeY =
            1;


        if (
            blinkWave >
            0.996
        ) {

            eyeY =
                0.08;

        }


        // ----------------------------------------------------
        // SURPRISE
        // ----------------------------------------------------

        let eyeScale =
            1;


        if (
            this.emotion ===
            "surprised"
        ) {

            eyeScale =
                1.28;

        }


        if (
            this.emotion ===
            "excited"
        ) {

            eyeScale =
                1.12;

        }


        this.leftEye.scale.set(
            eyeScale,
            eyeY * eyeScale,
            eyeScale
        );


        this.rightEye.scale.set(
            eyeScale,
            eyeY * eyeScale,
            eyeScale
        );


        // ----------------------------------------------------
        // THINKING EYE MOVEMENT
        // ----------------------------------------------------

        if (
            this.state ===
            "thinking"
        ) {

            this.eyeGroup.rotation.y =
                Math.sin(
                    this.time * 0.8
                ) *
                0.06;

        }
        else {

            this.eyeGroup.rotation.y =
                this.mouseX *
                0.05;

        }


        // ----------------------------------------------------
        // EYE GLOW
        // ----------------------------------------------------

        const eyePulse =
            0.7 +
            this.voiceLevel *
            0.3;


        this.leftEyeRing.scale.setScalar(
            eyePulse
        );


        this.rightEyeRing.scale.setScalar(
            eyePulse
        );

    }


    // ========================================================
    // GESTURES
    // ========================================================

    updateGestures(delta) {

        const amount =
            this.intensity;


        const idleWave =
            Math.sin(
                this.time * 1.2
            ) *
            0.025;


        // ----------------------------------------------------
        // IDLE BASE
        // ----------------------------------------------------

        this.leftArm.rotation.x +=
            (
                0 -
                this.leftArm.rotation.x
            ) *
            delta *
            4;


        this.rightArm.rotation.x +=
            (
                0 -
                this.rightArm.rotation.x
            ) *
            delta *
            4;


        this.leftArm.rotation.z +=
            (
                idleWave -
                this.leftArm.rotation.z
            ) *
            delta *
            4;


        this.rightArm.rotation.z +=
            (
                -idleWave -
                this.rightArm.rotation.z
            ) *
            delta *
            4;


        // ----------------------------------------------------
        // THINK
        // ----------------------------------------------------

        if (
            this.gesture ===
            "think"
        ) {

            this.rightArm.rotation.z =
                -0.38 *
                amount;


            this.rightArm.rotation.x =
                -0.22 *
                amount;


            this.head.rotation.z =
                0.035;

        }


        // ----------------------------------------------------
        // OPEN
        // ----------------------------------------------------

        else if (
            this.gesture ===
            "open"
        ) {

            this.leftArm.rotation.z =
                -0.55 *
                amount;


            this.rightArm.rotation.z =
                0.55 *
                amount;

        }


        // ----------------------------------------------------
        // EXPLAIN
        // ----------------------------------------------------

        else if (
            this.gesture ===
            "explain"
        ) {

            const wave =
                Math.sin(
                    this.time * 4
                ) *
                0.15;


            this.leftArm.rotation.z =
                -0.34 *
                amount +
                wave;


            this.rightArm.rotation.z =
                0.34 *
                amount -
                wave;


            this.leftArm.rotation.x =
                Math.sin(
                    this.time * 2.5
                ) *
                0.08;


            this.rightArm.rotation.x =
                Math.sin(
                    this.time * 2.5 +
                    Math.PI
                ) *
                0.08;

        }


        // ----------------------------------------------------
        // ALERT
        // ----------------------------------------------------

        else if (
            this.gesture ===
            "alert"
        ) {

            this.leftArm.rotation.z =
                -0.7 *
                amount;


            this.rightArm.rotation.z =
                0.7 *
                amount;

        }

    }


    // ========================================================
    // HOLOGRAM RINGS
    // ========================================================

    updateRings(delta) {

        this.rings.forEach(
            ring => {

                ring.rotation.z +=
                    delta *
                    ring.userData.speed;


                ring.rotation.x =
                    Math.sin(
                        this.time * 0.4
                    ) *
                    0.12;

            }
        );


        this.crown.rotation.z +=
            delta *
            0.45;

    }


    // ========================================================
    // PARTICLES
    // ========================================================

    updateParticles(delta) {

        if (
            !this.particles
        ) {

            return;

        }


        const positions =
            this.particles
                .geometry
                .attributes
                .position
                .array;


        for (
            let i = 0;
            i < this.particleData.length;
            i++
        ) {

            const particle =
                this.particleData[i];


            particle.angle +=
                delta *
                particle.speed;


            const radius =
                particle.radius +
                Math.sin(
                    this.time +
                    particle.phase
                ) *
                0.045;


            positions[
                i * 3
            ] =
                Math.cos(
                    particle.angle
                ) *
                radius;


            positions[
                i * 3 + 1
            ] =
                particle.y +
                Math.sin(
                    this.time *
                    0.7 +
                    particle.phase
                ) *
                0.045;


            positions[
                i * 3 + 2
            ] =
                Math.sin(
                    particle.angle
                ) *
                radius;

        }


        this.particles
            .geometry
            .attributes
            .position
            .needsUpdate =
            true;


        this.particles.rotation.y +=
            delta *
            0.025;


        this.particles.material.opacity =
            0.42 +
            this.intensity *
            0.18 +
            this.voiceLevel *
            0.25;

    }


    // ========================================================
    // ENERGY
    // ========================================================

    updateEnergy(delta) {

        this.energyLines.forEach(
            (
                line,
                index
            ) => {

                line.rotation.y +=
                    delta *
                    line.userData.speed;


                line.material.opacity =
                    0.035 +
                    Math.sin(
                        this.time * 2 +
                        index
                    ) *
                    0.018 +
                    this.voiceLevel *
                    0.07;

            }
        );

    }


    // ========================================================
    // SCAN
    // ========================================================

    updateScan(delta) {

        this.scanGroup.children.forEach(
            (
                scan,
                index
            ) => {

                scan.rotation.z +=
                    delta *
                    (
                        0.18 +
                        index *
                        0.07
                    );


                scan.material.opacity =
                    0.06 +
                    (
                        Math.sin(
                            this.time * 2 +
                            index
                        ) +
                        1
                    ) *
                    0.025;

            }
        );

    }


    // ========================================================
    // GROUND
    // ========================================================

    updateGround(delta) {

        this.ground.rotation.z +=
            delta *
            0.015;


        this.groundRings.forEach(
            (
                ring,
                index
            ) => {

                ring.rotation.z +=
                    delta *
                    (
                        index % 2 === 0
                            ? 0.05
                            : -0.035
                    );


                ring.material.opacity =
                    0.09 +
                    Math.sin(
                        this.time * 1.5 +
                        index
                    ) *
                    0.025;

            }
        );

    }


    // ========================================================
    // STATE BEHAVIOR
    // ========================================================

    updateState() {

        if (
            this.state ===
            "thinking"
        ) {

            this.head.rotation.y =
                Math.sin(
                    this.time * 0.75
                ) *
                0.07;


            this.coreGlow.material.opacity =
                0.11;


            this.particles.material.size =
                0.028;

        }


        else if (
            this.state ===
            "listening"
        ) {

            this.head.rotation.y =
                Math.sin(
                    this.time * 2
                ) *
                0.09;


            this.coreGlow.material.opacity =
                0.14;


            this.particles.material.size =
                0.032;

        }


        else if (
            this.state ===
            "speaking"
        ) {

            this.head.rotation.y =
                Math.sin(
                    this.time * 1.3
                ) *
                0.035;


            this.coreGlow.material.opacity =
                0.10 +
                this.voiceLevel *
                0.15;


            this.particles.material.size =
                0.025 +
                this.voiceLevel *
                0.018;

        }


        else if (
            this.state ===
            "warning"
        ) {

            this.coreGlow.material.opacity =
                0.16 +
                Math.sin(
                    this.time * 8
                ) *
                0.05;

        }


        else {

            this.coreGlow.material.opacity =
                0.08;

        }

    }


    // ========================================================
    // MAIN ANIMATION
    // ========================================================

    animate() {

        requestAnimationFrame(
            () => this.animate()
        );


        const delta =
            Math.min(
                this.clock.getDelta(),
                0.05
            );


        this.time +=
            delta;


        this.updateBody(
            delta
        );


        this.updateEyes();


        this.updateGestures(
            delta
        );


        this.updateRings(
            delta
        );


        this.updateParticles(
            delta
        );


        this.updateEnergy(
            delta
        );


        this.updateScan(
            delta
        );


        this.updateGround(
            delta
        );


        this.updateState();


        // ----------------------------------------------------
        // CAMERA MICRO MOVEMENT
        // ----------------------------------------------------

        this.camera.position.y =
            1.25 +
            Math.sin(
                this.time * 0.3
            ) *
            0.015;


        this.camera.lookAt(
            0,
            1.1,
            0
        );


        // ----------------------------------------------------
        // RENDER
        // ----------------------------------------------------

        this.renderer.render(
            this.scene,
            this.camera
        );

    }

}


// ============================================================
// GLOBAL
// ============================================================

if (
    typeof window !== "undefined"
) {

    window.HimiAvatar =
        HimiAvatar;

}


// ============================================================
// EXPORT
// ============================================================

export {
    HimiAvatar
};


export default HimiAvatar;