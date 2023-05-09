varying vec2 vUv;
uniform float time;
uniform sampler2D uTexture;
uniform sampler2D uImage;
void main() {

    vec4 color = texture2D( uImage, vUv );
    gl_FragColor = vec4(137./255.,157./255.,120./255., 1.0);


}