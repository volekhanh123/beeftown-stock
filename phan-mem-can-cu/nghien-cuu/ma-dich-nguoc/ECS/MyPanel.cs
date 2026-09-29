using System.ComponentModel;
using System.Windows.Forms;

namespace ECS;

public class MyPanel : Panel
{
	private IContainer components;

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this.components = new System.ComponentModel.Container();
	}

	public MyPanel()
	{
		InitializeComponent();
		DoubleBuffered = true;
	}
}
