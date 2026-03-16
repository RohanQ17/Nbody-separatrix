// Particle billboard render pass.
// Draws each body as a point-sprite / billboard quad.
// Size is proportional to log(mass).

struct VertexOutput {
  @builtin(position)   pos:       vec4<f32>,
  @location(0)         pointCoord: vec2<f32>,
  @location(1)         color:      vec3<f32>,
};

struct Uniforms {
  viewProj:   mat4x4<f32>,
  screenSize: vec2<f32>,
  pointScale: f32,
  _pad:       f32,
};

@group(0) @binding(0) var<storage, read> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> masses:    array<f32>;
@group(0) @binding(2) var<uniform>       uniforms:  Uniforms;

// Each particle is drawn as a quad (2 triangles = 6 vertices).
// Vertex index encodes which corner of the quad.
const QUAD_OFFSETS: array<vec2<f32>, 6> = array<vec2<f32>, 6>(
  vec2<f32>(-1.0, -1.0),
  vec2<f32>( 1.0, -1.0),
  vec2<f32>(-1.0,  1.0),
  vec2<f32>(-1.0,  1.0),
  vec2<f32>( 1.0, -1.0),
  vec2<f32>( 1.0,  1.0),
);

@vertex
fn vs_main(
  @builtin(vertex_index)   vid: u32,
  @builtin(instance_index) iid: u32,
) -> VertexOutput {
  let pos3 = positions[iid].xyz;
  let mass = masses[iid];

  // Billboard size proportional to log(mass + 1)
  let size = uniforms.pointScale * (log(mass + 1.0) * 0.3 + 0.5);

  let cornerOffset = QUAD_OFFSETS[vid % 6u];
  let clipPos = uniforms.viewProj * vec4<f32>(pos3, 1.0);

  // Offset in screen-space (NDC)
  let aspect = uniforms.screenSize.x / uniforms.screenSize.y;
  var offset = cornerOffset * size / uniforms.screenSize;
  offset.x /= aspect;

  var out: VertexOutput;
  out.pos = clipPos + vec4<f32>(offset * clipPos.w, 0.0, 0.0);
  out.pointCoord = cornerOffset;

  // Color based on mass (blue → white gradient)
  let t = clamp(log(mass + 1.0) / 4.0, 0.0, 1.0);
  out.color = mix(vec3<f32>(0.4, 0.6, 1.0), vec3<f32>(1.0, 0.95, 0.8), t);

  return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
  // Circular particle with soft edge
  let d = length(in.pointCoord);
  if (d > 1.0) { discard; }

  let alpha = 1.0 - smoothstep(0.5, 1.0, d);
  let glow  = exp(-d * d * 2.0);

  let col = in.color * (0.7 + 0.3 * glow);
  return vec4<f32>(col, alpha);
}
