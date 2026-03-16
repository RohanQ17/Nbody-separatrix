// All-pairs gravity compute shader
// Computes gravitational acceleration for each body using O(N²) direct sum.

struct Uniforms {
  n:         u32,
  dt:        f32,
  softening: f32,
  _pad:      u32,
};

@group(0) @binding(0) var<storage, read>       positions:     array<vec4<f32>>;
@group(0) @binding(1) var<storage, read_write>  velocities:    array<vec4<f32>>;
@group(0) @binding(2) var<storage, read>        masses:        array<f32>;
@group(0) @binding(3) var<storage, read_write>  accelerations: array<vec4<f32>>;
@group(0) @binding(4) var<uniform>              uniforms:      Uniforms;

const WORKGROUP_SIZE: u32 = 64;

@compute @workgroup_size(WORKGROUP_SIZE)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  let n = uniforms.n;
  if (i >= n) { return; }

  let pos_i = positions[i].xyz;
  let eps2  = uniforms.softening * uniforms.softening;

  var acc = vec3<f32>(0.0, 0.0, 0.0);

  for (var j: u32 = 0; j < n; j++) {
    if (j == i) { continue; }

    let r   = positions[j].xyz - pos_i;
    let d2  = dot(r, r) + eps2;
    let inv = inverseSqrt(d2);
    let inv3 = inv * inv * inv;

    acc += r * (masses[j] * inv3);
  }

  accelerations[i] = vec4<f32>(acc, 0.0);
}
