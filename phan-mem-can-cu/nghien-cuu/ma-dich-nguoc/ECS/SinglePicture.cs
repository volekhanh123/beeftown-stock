using System;
using System.Drawing;

namespace ECS;

[Serializable]
public class SinglePicture
{
	public int ID;

	public string Name;

	public int Used;

	public Image Picture;

	public string PicString;

	public string PicSize;
}
