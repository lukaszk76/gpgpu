varying vec2 vUv;
uniform float time;
uniform sampler2D uCurrentPositions;
uniform sampler2D uOriginalPositions;
uniform sampler2D uOriginalPositions1;
uniform vec3 uMouse;
uniform float progress;

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {

    vec2 position = texture2D( uCurrentPositions, vUv ).xy;
    vec2 original = texture2D( uOriginalPositions, vUv ).xy;
    vec2 original1 = texture2D( uOriginalPositions1, vUv ).xy;
    vec2 finalOriginal = mix(original, original1, progress);
    vec2 speed = texture2D( uCurrentPositions, vUv ).zw;
    float offset = rand(vUv);

    float frictionFactor = 0.99;
    float gravity = 0.001;
    float mouseForce = 0.001;
    float maxSpeed = 0.1;
    float maxMouseDist = 0.2;
    float minGravityDist = 0.001;
    float lifespan = 10.0;
    float youngness = 0.1;

    float dist = distance(finalOriginal, position);
    vec2 gravityDir = normalize(finalOriginal - position);
    if (dist > minGravityDist) {
        speed = speed + gravityDir * gravity * dist;
    }

    float mouseDist = distance(uMouse.xy, position);
    if (mouseDist < maxMouseDist) {
        float force = 1.0 - (mouseDist / maxMouseDist);
        vec2 mouseDir = normalize(position - uMouse.xy);
        speed = speed + mouseDir * force * mouseForce;
    }

    speed = speed * frictionFactor;

    if (length(speed) > maxSpeed) {
        speed = normalize(speed) * maxSpeed;
    }

    position = position + speed;

    float age = mod(time + offset * lifespan, lifespan);
    if (age < youngness) {
        speed = vec2(rand(vUv + vec2(0.1, 0.1)) - 0.5, rand(vUv + vec2(0.2, 0.2)) - 0.5) * 0.001;
        position = finalOriginal;
    }

    gl_FragColor = vec4(position, speed);
}