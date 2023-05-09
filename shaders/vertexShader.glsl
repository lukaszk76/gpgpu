varying vec2 vUv;
uniform float time;
uniform sampler2D uTexture;

void main() {

    vUv = uv;
    vec3 pos = position;
    pos.xy = texture2D( uTexture, vUv ).xy;

    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );

    gl_PointSize = ( 1.3 / -mvPosition.z );

    gl_Position = projectionMatrix * mvPosition;

}