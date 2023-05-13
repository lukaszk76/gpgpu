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

    float maxAge = 10.;
    float youngness = 0.05;

    vec3 position = texture2D( uCurrentPositions, vUv ).xyz;
    vec3 original = texture2D( uOriginalPositions, vUv ).xyz;
    vec3 speed = texture2D( uCurrentSpeed, vUv ).xyz;

    position += speed;

    float offset = rand(vUv + time) * maxAge;
    float age = mod((time + offset), maxAge);
    if (age < youngness) {
        position = original;
    }


    gl_FragColor = vec4(position, 1.0);
}