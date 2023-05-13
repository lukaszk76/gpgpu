uniform float time;
uniform sampler2D uOriginalPositions;
uniform sampler2D uOriginalPositions1;
uniform vec3 uMouse;
uniform float progress;

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 vUv = gl_FragCoord.xy / resolution.xy;

    float maxDistance = 0.1;
    float minDistance = 0.001;
    float tension = 0.985;
    float gravity = 0.0001;
    float mouseForce = 0.001;
    float maxSpeed = 0.1;
    float maxAge = 10.;
    float youngness = 0.05;

    vec3 position = texture2D( uCurrentPositions, vUv ).xyz;
    vec3 original = texture2D( uOriginalPositions, vUv ).xyz;
    vec3 speed = texture2D( uCurrentSpeed, vUv ).xyz;

    //tension
    speed *= tension;

    //gravity
    vec3 gravityDirection = normalize(original - position);
    float dist = distance(position, original);
    if (dist > minDistance) {
        speed += gravityDirection * gravity * dist;
    }


    //mouse
    float mouseDist = distance(position, uMouse);
    if (mouseDist < maxDistance) {
        vec3 direction = normalize(position - uMouse);
        float distanceImpact = (1.0 - mouseDist/maxDistance);
        speed += direction * distanceImpact * mouseForce;
    }

    //speed
    speed = clamp(speed, -maxSpeed, maxSpeed);

    float offset = rand(vUv + time) * maxAge;
    float age = mod((time + offset), maxAge);
    if (age < youngness) {
        float x = (rand(vec2(vUv.x + time, vUv.y + time)) - 0.5) * 0.002;
        float y = (rand(vec2(vUv.x + time * 1.1, vUv.x + time * 1.2)) - 0.5) * 0.002;
        float z = (rand(vec2(vUv.y + time * 1.2, vUv.y + time * 1.1)) - 0.5) * 0.002;

        speed = vec3(x,y,z);
    }

    gl_FragColor = vec4(speed, 1.0);
}