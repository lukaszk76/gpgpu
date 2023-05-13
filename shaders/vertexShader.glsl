varying vec2 vUv;
uniform float time;
uniform sampler2D uTexture;

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);

    float res = mix(
    mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
    mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

void main() {

    vUv = uv;
    vec3 pos = position;
    pos.xyz = texture2D( uTexture, vUv ).xyz;

    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );

    float noiseVal = noise(vec2(uv.x, uv.y));

    gl_PointSize = ( noiseVal * 4.0 / -mvPosition.z );

    gl_Position = projectionMatrix * mvPosition;

}